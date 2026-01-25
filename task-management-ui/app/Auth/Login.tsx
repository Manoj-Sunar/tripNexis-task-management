"use client"
import React, { useState } from "react";
import InputField from "../components/TextField/InputField";
import Button from "../components/UI/Button";



const Login: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");




    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        try {

        } catch (error) {
            console.error(error);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f5f8fa] px-4">
            <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 sm:p-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-2xl font-bold text-gray-900">Welcome Back</h1>
                    <p className="text-gray-500 mt-2">
                        Enter your credentials to access your account
                    </p>
                </div>

                {/* Form */}
                <form className="space-y-6" onSubmit={handleLogin}>
                    <InputField
                        type="email"
                        value={email}
                        setValue={setEmail}
                        placeholder="Email"
                        className=""
                    />
                    <InputField
                        type="password"
                        value={password}
                        setValue={setPassword}
                        placeholder="Password"
                        className=""
                    />



                    <Button type="submit" label="Login" />
                </form>

                {/* Footer */}
                <p className="text-center text-gray-500 mt-6 text-sm">
                    Don't have an account?{" "}
                    <a href="#" className="text-primary font-medium hover:underline">
                        Sign Up
                    </a>
                </p>
            </div>
        </div>
    );
};

export default Login;
