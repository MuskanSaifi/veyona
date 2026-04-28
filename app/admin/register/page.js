// app/admin/register/page.js
"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminRegister() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    const res = await fetch("/api/admin/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (res.ok) {
      router.push("/admin/dashboard");
    } else {
      alert(data.message);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Admin Register</h2>

      <form onSubmit={handleSubmit}>
        <input
          placeholder="Email"
          type="email"
          required
          onChange={(e) => setEmail(e.target.value)}
        />
        <br /><br />

        <input
          placeholder="Password"
          type="password"
          required
          onChange={(e) => setPassword(e.target.value)}
        />
        <br /><br />

        <button>Create Admin</button>
      </form>
    </div>
  );
}
