"use client";

import { useState } from "react";
import { AlertCircle, CheckCircle2, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type SignupState = "idle" | "loading" | "success" | "error";

export function UpdatesSignupForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SignupState>("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;

    setState("loading");
    setMessage("");

    try {
      const response = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          source: "updates_newsletter",
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.error || "We could not subscribe this email right now.");
      }

      setState("success");
      setMessage("Check your inbox to confirm Status & Updates.");
      setEmail("");
    } catch (error) {
      setState("error");
      setMessage(error instanceof Error ? error.message : "Something went wrong. Please try again.");
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row lg:flex-col xl:flex-row">
        <label htmlFor="updates-email" className="sr-only">
          Email address
        </label>
        <Input
          id="updates-email"
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@company.com"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          disabled={state === "loading"}
          required
          className="bg-background"
        />
        <Button type="submit" disabled={state === "loading"} className="shrink-0">
          <Mail className="mr-2 h-4 w-4" aria-hidden="true" />
          {state === "loading" ? "Subscribing..." : "Subscribe"}
        </Button>
      </div>

      {message && (
        <p
          className={
            state === "success"
              ? "flex items-start gap-2 text-sm text-teal-700"
              : "flex items-start gap-2 text-sm text-destructive"
          }
        >
          {state === "success" ? (
            <CheckCircle2 className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          ) : (
            <AlertCircle className="mt-0.5 h-4 w-4 flex-none" aria-hidden="true" />
          )}
          <span>{message}</span>
        </p>
      )}

      <p className="text-xs leading-5 text-muted-foreground">
        Product, status and known-issue updates only. Double opt-in, no spam.
      </p>
    </form>
  );
}
