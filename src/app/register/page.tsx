import { Suspense } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function Register() {
  return <Suspense><LoginForm mode="register" /></Suspense>;
}
