import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";

interface Order {
  id: string;
  user_id: string;
  total: number;
  status: string;
  discount_code: string | null;
  discount_amount: number;
  created_at: string;
  order_items: {
    quantity: number;
    price: number;
    products: {
      name: string;
    };
  }[];
}

const Orders = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // VULNERABILITY: IDOR - orderId from URL without authorization check
  const orderIdParam = searchParams.get("orderId");
  
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, [orderIdParam]);

  // VULNERABILITY: Can view any order by passing orderId parameter
  const fetchOrders = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      navigate("/auth");
      return;
    }

    let query = supabase
      .from("orders")
      .select(`
        *,
        order_items(
          quantity,
          price,
          products(name)
        )
      `)
      .order("created_at", { ascending: false });

    // VULNERABILITY: If orderId param exists, fetch that specific order (IDOR)
    if (orderIdParam) {
      query = query.eq("id", orderIdParam);
    } else {
      // Normal flow - fetch user's own orders
      query = query.eq("user_id", user.id);
    }

    const { data } = await query;

    if (data) {
      setOrders(data);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">Order History</h1>

        {orders.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-xl text-muted-foreground">No orders yet</p>
          </Card>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <Card key={order.id} className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Order ID</p>
                    {/* VULNERABILITY: Order ID exposed for IDOR attacks */}
                    <p className="font-mono text-sm">{order.id}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      View this order: ?orderId={order.id}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">
                      ${order.total.toFixed(2)}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {order.discount_code && (
                  <div className="bg-accent/20 p-2 rounded mb-4">
                    <p className="text-sm">
                      Discount applied: <span className="font-semibold">{order.discount_code}</span>
                      {" "}(-${order.discount_amount.toFixed(2)})
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between text-sm">
                      <span>
                        {item.products.name} x {item.quantity}
                      </span>
                      <span className="font-medium">
                        ${(item.price * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t">
                  <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium
                    ${order.status === 'completed' ? 'bg-accent text-accent-foreground' : 'bg-muted'}`}>
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Orders;