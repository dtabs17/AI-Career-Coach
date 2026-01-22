import { Navigate } from "react-router-dom";
import { Spinner } from "react-bootstrap";
import { useAuth } from "../auth/AuthContext";

export default function ProtectedRoute({ children }) {
    const { isReady, isAuthed } = useAuth();

    if (!isReady) {
        return (
            <div className="d-flex justify-content-center py-5">
                <Spinner />
            </div>
        );
    }

    if (!isAuthed) return <Navigate to="/login" replace />;
    return children;
}
