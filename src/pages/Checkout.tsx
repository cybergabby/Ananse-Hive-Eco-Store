import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const discountCodeFromCart = location.state?.discountCode || "";
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [balance, setBalance] = useState(0);
  const [discountCode, setDiscountCode] = useState(discountCodeFromCart);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCart();
    fetchBalance();
    if (discountCode) {
      validateDiscount();
    }
  }, []);

  const loadCart = () => {
    const cartData = JSON.parse(localStorage.getItem("cart") || "[]");
    setCart(cartData);
  };

  const fetchBalance = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data } = await supabase
        .from("profiles")
        .select("balance")
        .eq("id", user.id)
        .single();
      
      if (data) {
        setBalance(data.balance);
      }
    }
  };

  // VULNERABILITY: Client-side discount validation allows manipulation
  const validateDiscount = async () => {
    const { data } = await supabase
      .from("discount_codes")
      .select("*")
      .eq("code", discountCode.toUpperCase())
      .eq("active", true)
      .single();

    if (data) {
      setDiscountPercent(data.discount_percent);
      toast.success(`Discount applied: ${data.discount_percent}% off!`);
    } else {
      setDiscountPercent(0);
      toast.error("Invalid discount code");
    }
  };

  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  // VULNERABILITY: Discount calculation on client-side can be tampered
  const discountAmount = (subtotal * discountPercent) / 100;
  const total = subtotal - discountAmount;

  const placeOrder = async () => {
    if (cart.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // VULNERABILITY: No server-side validation of final price
    if (total > balance) {
      toast.error("Insufficient balance");
      return;
    }

    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please login to continue");
        navigate("/auth");
        return;
      }

      // Create order
      const { data: order, error: orderError } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          total: total, // VULNERABILITY: Client-calculated total accepted directly
          discount_code: discountCode,
          discount_amount: discountAmount,
          status: "completed",
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map((item) => ({
        order_id: order.id,
        product_id: item.id,
        quantity: item.quantity,
        price: item.price,
      }));

      const { error: itemsError } = await supabase
        .from("order_items")
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // VULNERABILITY: Race condition - balance update not atomic
      const newBalance = balance - total;
      const { error: balanceError } = await supabase
        .from("profiles")
        .update({ balance: newBalance })
        .eq("id", user.id);

      if (balanceError) throw balanceError;

      localStorage.removeItem("cart");
      toast.success("Order placed successfully!");
      navigate("/orders");
    } catch (error: any) {
      console.error("Order error:", error);
      toast.error("Failed to place order");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <Card className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold">Order Items</h2>
              {cart.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b">
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                  </div>
                  <p className="font-semibold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
              ))}
            </Card>
          </div>

          <div>
            <Card className="p-6 space-y-4">
              <h2 className="text-2xl font-semibold">Payment</h2>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                {discountPercent > 0 && (
                  <div className="flex justify-between text-accent">
                    <span>Discount ({discountPercent}%)</span>
                    <span>-${discountAmount.toFixed(2)}</span>
                  </div>
                )}
                <div className="flex justify-between text-xl font-bold border-t pt-2">
                  <span>Total</span>
                  <span className="text-primary">${total.toFixed(2)}</span>
                </div>
              </div>

              <div className="bg-muted p-4 rounded">
                <p className="text-sm font-medium mb-1">Your Balance</p>
                <p className="text-2xl font-bold text-primary">${balance.toFixed(2)}</p>
              </div>

              <Button
                onClick={placeOrder}
                disabled={loading || total > balance}
                className="w-full"
                size="lg"
              >
                {loading ? "Processing..." : "Place Order"}
              </Button>

              {total > balance && (
                <p className="text-sm text-destructive text-center">
                  Insufficient balance. Please add funds.
                </p>
              )}
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;