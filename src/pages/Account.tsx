import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface Profile {
  id: string;
  username: string;
  balance: number;
}

const Account = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // VULNERABILITY: IDOR - userId from URL parameter without proper authorization
  const userIdParam = searchParams.get("userId");
  
  const [profile, setProfile] = useState<Profile | null>(null);
  const [email, setEmail] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    fetchProfile();
  }, [userIdParam]);

  // VULNERABILITY: Fetches profile based on URL parameter, bypassing authorization
  const fetchProfile = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user && !userIdParam) {
      navigate("/auth");
      return;
    }

    // VULNERABILITY: If userId param exists, fetch that user's profile (IDOR)
    const targetUserId = userIdParam || user?.id;
    
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", targetUserId)
      .single();

    if (data) {
      setProfile(data);
    }

    if (user) {
      setEmail(user.email || "");
    }
  };

  // VULNERABILITY: No rate limiting on profile updates
  const updateProfile = async () => {
    if (!profile) return;

    const { error } = await supabase
      .from("profiles")
      .update({ username: profile.username })
      .eq("id", profile.id);

    if (error) {
      toast.error("Failed to update profile");
    } else {
      toast.success("Profile updated!");
      setIsEditing(false);
    }
  };

  if (!profile) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />

      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold mb-8">My Account</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Profile Information</h2>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Email</label>
              <Input value={email} disabled />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Username</label>
              <div className="flex gap-2">
                <Input
                  value={profile.username || ""}
                  onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                  disabled={!isEditing}
                />
                {isEditing ? (
                  <Button onClick={updateProfile}>Save</Button>
                ) : (
                  <Button onClick={() => setIsEditing(true)}>Edit</Button>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">User ID</label>
              {/* VULNERABILITY: Exposes user ID which can be used for IDOR attacks */}
              <Input value={profile.id} disabled />
              <p className="text-xs text-muted-foreground">
                Share this ID to view other user profiles: ?userId={profile.id}
              </p>
            </div>
          </Card>

          <Card className="p-6 space-y-4">
            <h2 className="text-2xl font-semibold">Wallet</h2>
            
            <div className="bg-primary/10 p-6 rounded-lg text-center">
              <p className="text-sm text-muted-foreground mb-2">Current Balance</p>
              <p className="text-4xl font-bold text-primary">${profile.balance.toFixed(2)}</p>
            </div>

            <Button onClick={() => navigate("/orders")} variant="outline" className="w-full">
              View Order History
            </Button>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Account;