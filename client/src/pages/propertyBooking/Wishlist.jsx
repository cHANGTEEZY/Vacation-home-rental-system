import { useState, useCallback, useEffect } from "react";
import { Heart } from "lucide-react";
import { toast } from "react-toastify";

const Wishlist = ({ id, initialSaved = false }) => {
  const [saved, setSaved] = useState(initialSaved);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const checkIfIsWishlist = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setSaved(false);
        return;
      }

      try {
        const response = await fetch(`http://localhost:3000/wishlist/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setSaved(data.isWishlist);
        } else if (response.status === 404) {
          setSaved(false);
        } else {
          throw new Error("Failed to check wishlist status");
        }
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong"
        );
      }
    };

    checkIfIsWishlist();
  }, [id]);

  const addWishlist = useCallback(
    async (propertyId) => {
      if (isLoading) return;
      setIsLoading(true);

      const token = localStorage.getItem("token");

      try {
        const method = saved ? "DELETE" : "POST";

        const response = await fetch(
          `http://localhost:3000/wishlist/${propertyId}`,
          {
            method,
            headers: {
              "Content-Type": "application/json",
              authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "An error occurred");
        }

        setSaved(!saved);
        toast.success(
          data.message ||
            `Property ${saved ? "removed from" : "added to"} wishlist`
        );
      } catch (err) {
        toast.error(
          err instanceof Error ? err.message : "Something went wrong"
        );
        console.error("Wishlist operation failed", err);
      } finally {
        setIsLoading(false);
      }
    },
    [id, saved, isLoading]
  );

  return (
    <button
      onClick={() => addWishlist(id)}
      disabled={isLoading}
      className={`flex items-center gap-2 ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
    >
      <Heart
        color={saved ? "green" : "currentColor"}
        strokeWidth={saved ? 2.7 : 1.5}
        fill={saved ? "green" : "none"}
      />
      {saved ? "Saved" : "Save"}
    </button>
  );
};

export default Wishlist;
