"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import logo from "@/public/logo.png";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function SignupPage() {
    const router = useRouter();
    
    // 1. Setup state for form data, loading status, and errors
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        password: "",
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    // 2. Handle input changes
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    // 3. Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError("");

        try {
            // Replace with your actual full backend URL if it's hosted elsewhere
            const response = await fetch("https://ella-v1.onrender.com/api/auth/register/", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok) {
                // If the server returns 400 Bad Request etc.
                throw new Error(data.message || "Something went wrong during registration.");
            }

            // Success! The API returned 201 Created.
            // Redirect the user to the login page to sign in
            router.push("/auth/login"); // adjust path if your login is elsewhere

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <section className="flex min-h-screen bg-zinc-50 px-4 py-16 md:py-32 dark:bg-transparent">
            <form
                onSubmit={handleSubmit}
                className="bg-muted m-auto h-fit w-full max-w-sm overflow-hidden rounded-[calc(var(--radius)+.125rem)] border shadow-md shadow-zinc-950/5 dark:[--color-muted:var(--color-zinc-900)]"
            >
                <div className="bg-card -m-px rounded-[calc(var(--radius)+.125rem)] border p-8 pb-6">
                    <div className="text-center">
                        <Link
                            href="/"
                            aria-label="go home"
                            className="mx-auto block w-fit"
                        >
                            <Image src={logo} alt="Logo" width={50} height={50} priority />
                        </Link>
                        <h1 className="mb-1 mt-4 text-xl font-semibold">Create your Ella Account</h1>
                        <p className="text-sm">Welcome! Create an account to get started</p>
                    </div>

                    <div className="mt-6 space-y-4">
                        {/* Error Message Display */}
                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 dark:bg-red-950/50 rounded-md border border-red-200 dark:border-red-900">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="username" className="block text-sm">
                                Username
                            </Label>
                            <Input
                                type="text"
                                required
                                name="username"
                                id="username"
                                value={formData.username}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="block text-sm">
                                Email
                            </Label>
                            <Input
                                type="email"
                                required
                                name="email"
                                id="email"
                                value={formData.email}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm">
                                Password
                            </Label>
                            <Input
                                type="password"
                                required
                                name="password"
                                id="password"
                                value={formData.password}
                                onChange={handleChange}
                                disabled={isLoading}
                            />
                        </div>

                        <Button type="submit" className="w-full mt-6" disabled={isLoading}>
                            {isLoading ? "Creating account..." : "Sign Up"}
                        </Button>
                    </div>
                </div>

                <div className="p-3">
                    <p className="text-accent-foreground text-center text-sm">
                        Have an account?
                        <Button asChild variant="link" className="px-2">
                            {/* Adjusted the link path to match standard app router paths */}
                            <Link href="/auth/login">Sign In</Link> 
                        </Button>
                    </p>
                </div>
            </form>
        </section>
    );
}