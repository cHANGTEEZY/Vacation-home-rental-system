import "./HostDetails.css";

import { useEffect, useState } from "react";

import { User } from "lucide-react";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

const HostDetails = ({ id, showHostDetails = true, showHostName = false }) => {
  const [hostDetail, setHostDetail] = useState({});

  useEffect(() => {
    const getHostDetail = async () => {
      try {
        const response = await fetch(
          `http://localhost:3000/get-property-listings/host-name/${id}`
        );
        const data = await response.json();

        if (response.ok) {
          setHostDetail({
            hostName: data.hostName,
            hostAddress: data.hostAddress,
            hostPhoneNumber: data.hostPhoneNumber,
          });
        } else {
          toast.error(data.message);
        }
      } catch (err) {
        toast.error("Failed to fetch host details");
        console.log(err.message);
      }
    };

    if (id) {
      getHostDetail();
    }
  }, [id]);

  return (
    <>
      {showHostName && <p>Nested by {hostDetail.hostName}</p>}

      {showHostDetails && (
        <div className="meet-your-host-div">
          <h1 className="meet-your-host-header">Meet your Host</h1>
          <div className="host-card-flex">
            <div className="host-card">
              <div className="host-card-left">
                <User size={70} strokeWidth={1.4} />
              </div>
            </div>
            <div className="host-details">
              <span>Host Name: {hostDetail.hostName || "N/A"}</span>
              <span>Host Address: {hostDetail.hostAddress || "N/A"}</span>
              <span>
                Host Phone Number: {hostDetail.hostPhoneNumber || "N/A"}
              </span>
              <Link
                to={`/chat-with-host/${id}?hostname=${encodeURIComponent(
                  hostDetail.hostName
                )}`}
              >
                <button>Message Host</button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HostDetails;
