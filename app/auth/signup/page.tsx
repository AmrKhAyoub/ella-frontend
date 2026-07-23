"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import logo from "@/public/logoo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function SignupPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const baseUrl = "https://ella-v1.onrender.com";

      const response = await fetch(`${baseUrl}/api/auth/register/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Extract meaningful error messages (customize based on your API)
        const errorMessage =
          data.message ||
          data.detail ||
          (data.email && data.email[0]) ||
          (data.username && data.username[0]) ||
          (data.password && data.password[0]) ||
          "Registration failed. Please try again.";

        throw new Error(errorMessage);
      }

      toast.success("Account created!", {
        description: "You can now sign in with your credentials.",
      });

      router.push("/auth/login");
    } catch (err: any) {
      toast.error("Registration failed", {
        description: err.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen flex-col justify-center bg-background lg:grid lg:grid-cols-2">
      {/* Left Panel - same as login */}
      <div className="relative hidden h-[90%] rounded-4xl my-auto ml-[3%] flex-col justify-between border-r p-10 text-white lg:flex">
        <div className="absolute inset-0 bg-zinc-950 overflow-hidden rounded-4xl">
          <img
            src="https://images.unsplash.com/photo-1534723328310-e82dad3ee43f?w=1200&auto=format&fit=crop&q=80"
            alt="AI Background"
            className="absolute rounded-4xl inset-0 h-full w-full object-cover opacity-90 transition-transform duration-1000 hover:scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/90 via-zinc-950/20 to-zinc-950/80" />
        </div>

        <div className="relative z-20 flex items-center gap-3 text-lg font-medium tracking-tight">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/10 p-1.5 shadow-sm border border-white/20 backdrop-blur-md">
            <Image src={logo} alt="Ella Logo" width={24} height={24} className="object-contain" />
          </div>
          Ella AI
        </div>

        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-4">
            <p className="text-xl italic leading-relaxed text-zinc-100 drop-shadow-md">
              &ldquo;Ella has completely revolutionized how we approach data reasoning and conversational AI. It's an indispensable part of our daily workflow.&rdquo;
            </p>
          </blockquote>
        </div>
      </div>

      {/* Right Panel - Signup Form */}
      <div className="flex w-full items-center justify-center p-6 sm:p-12 lg:p-8">
        <div className="mx-auto flex w-full max-w-sm flex-col justify-center space-y-8">
          {/* Mobile Header */}
          <div className="flex flex-col space-y-3 text-center">
            <div className="flex justify-center lg:hidden mb-2">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/5 border border-primary/10 shadow-sm p-2">
                <Image src={logo} alt="Ella Logo" width={36} height={36} className="object-contain" />
              </div>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">
              Create your account
            </h1>
            <p className="text-sm text-muted-foreground">
              Join Ella and start learning in a smarter way!
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              {/* Username */}
              <div className="space-y-2">
                <Label htmlFor="username" className="font-medium">
                  Username
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="johndoe"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11 bg-muted transition-colors focus-visible:ring-2"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="font-medium">
                  Email address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="name@example.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11 bg-muted transition-colors focus-visible:ring-2"
                />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="font-medium">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="••••••••"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="h-11 bg-muted transition-colors focus-visible:ring-2"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="h-11 w-full text-base font-medium transition-all"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <Link
              href="/auth/login"
              className="font-semibold text-primary hover:underline underline-offset-4 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}