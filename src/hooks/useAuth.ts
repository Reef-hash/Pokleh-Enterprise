import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { toast } from "sonner";

export const useAuth = () => {
  const store = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (!store.initialized) {
      store.restoreSession();
    }
  }, [store.initialized]);

  const signIn = async (email: string, password: string) => {
    const result = await store.signIn(email, password);
    if (result.success) {
      toast.success("Successfully signed in!");
      navigate("/", { replace: true });
    } else {
      toast.error(result.error || "Login failed");
    }
    return result;
  };

  const signUp = async (email: string, password: string, name: string, role: "admin" | "staff") => {
    const result = await store.signUp(email, password, name, role);
    if (result.success) toast.success("Account created successfully!");
    else toast.error(result.error || "Signup failed");
    return result;
  };

  const signOut = async () => {
    await store.signOut();
    toast.success("Successfully signed out!");
    navigate("/", { replace: true });
  };

  return {
    user: store.user,
    session: store.session,
    profile: store.profile,
    loading: store.loading,
    signIn,
    signUp,
    signOut,
    isAuthenticated: store.isAuthenticated(),
    isAdmin: store.isAdmin(),
    isStaff: store.isStaff(),
  };
};
