import ResetPassword from "../components/ResetPassword";
import "../../app/styles/globals.css";
import {Suspense} from "react";

export default function ResetPasswordPage() {
  return (
<Suspense fallback={<p>Loading...</p>}>
    <div style={{ overflow: "hidden" }}>
      <ResetPassword />
    </div>
    </Suspense>

  );
}
