import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

const EventDetails = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [passcodeRequired, setPasscodeRequired] = useState(false);
  const [passcodeInput, setPasscodeInput] = useState("");

  const [customAmount, setCustomAmount] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [sendingInvite, setSendingInvite] = useState(false);
  const [inviteMessage, setInviteMessage] = useState(null);

  // RSVP States
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [myRSVP, setMyRSVP] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState(null);

  // Attendance States (for organizer)
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const isOrganizer =
    !!user &&
    !!event &&
    user._id?.toString() === event.organizer?._id?.toString();

  const fetchEvent = async (passcodeOverride = "") => {
    try {
      const headers = passcodeOverride
        ? { "x-passcode": passcodeOverride }
        : {};
      const { data } = await axios.get(`${API_URL}/api/events/${id}`, {
        headers,
        withCredentials: true,
      });
      setEvent(data);
      setPasscodeRequired(false);
    } catch (error) {
      if (error.response?.status === 403 && error.response?.data?.isPrivate) {
        setPasscodeRequired(true);
      } else {
        console.error("Failed to fetch event", error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance list (for organizer)
  const fetchAttendanceList = async () => {
    try {
      setAttendanceLoading(true);
      const { data } = await axios.get(
        `${API_URL}/api/events/${id}/attendance`,
        {
          withCredentials: true,
        },
      );
      setAttendanceList(data.rsvps);
      setAttendanceStats(data.stats);
    } catch (error) {
      console.error("Failed to fetch attendance", error);
    } finally {
      setAttendanceLoading(false);
    }
  };

  // Check my RSVP status
  const checkMyRSVP = async (email) => {
    try {
      const { data } = await axios.get(
        `${API_URL}/api/events/${id}/rsvp?email=${encodeURIComponent(email)}`,
      );
      setMyRSVP(data);
      return data;
    } catch (error) {
      setMyRSVP(null);
      return null;
    }
  };

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlPasscode = urlParams.get("passcode");
    if (urlPasscode) {
      setPasscodeInput(urlPasscode);
      fetchEvent(urlPasscode);
    } else {
      fetchEvent();
    }
  }, [id]);

  useEffect(() => {
    if (showAttendance && isOrganizer) {
      fetchAttendanceList();
    }
  }, [showAttendance, id, isOrganizer]);

  const handlePasscodeSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    fetchEvent(passcodeInput);
  };

  useEffect(() => {
    const loadRazorpayScript = () => {
      return new Promise((resolve) => {
        const script = document.createElement("script");
        script.src = "https://checkout.razorpay.com/v1/checkout.js";
        script.onload = () => resolve(true);
        script.onerror = () => resolve(false);
        document.body.appendChild(script);
      });
    };
    loadRazorpayScript();
  }, []);

  const handleSendInvite = async (e) => {
    e.preventDefault();
    if (!inviteEmail || !inviteEmail.includes("@")) {
      setInviteMessage({
        type: "error",
        text: "Please enter a valid email address",
      });
      return;
    }

    setSendingInvite(true);
    setInviteMessage(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/events/${id}/invite`,
        { email: inviteEmail },
        { withCredentials: true },
      );
      setInviteMessage({
        type: "success",
        text: "Invitation sent successfully!",
      });
      setInviteEmail("");
      // Refresh attendance list if showing
      if (showAttendance) {
        fetchAttendanceList();
      }
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to send invitation";
      setInviteMessage({ type: "error", text: errorMsg });
    } finally {
      setSendingInvite(false);
    }
  };

  // Handle RSVP response
  const handleRSVP = async (status) => {
    if (!rsvpEmail || !rsvpEmail.includes("@")) {
      setRsvpMessage({
        type: "error",
        text: "Please enter a valid email address",
      });
      return;
    }

    setRsvpLoading(true);
    setRsvpMessage(null);

    try {
      const response = await axios.post(
        `${API_URL}/api/events/${id}/rsvp`,
        { email: rsvpEmail, status },
        { withCredentials: true },
      );
      setRsvpMessage({
        type: "success",
        text: `You have ${status} the invitation!`,
      });
      setMyRSVP(response.data.rsvp);
    } catch (error) {
      const errorMsg =
        error.response?.data?.message || "Failed to respond to invitation";
      setRsvpMessage({ type: "error", text: errorMsg });
    } finally {
      setRsvpLoading(false);
    }
  };

  // Check RSVP by email
  const handleCheckRSVP = async (e) => {
    e.preventDefault();
    if (!rsvpEmail || !rsvpEmail.includes("@")) {
      setRsvpMessage({
        type: "error",
        text: "Please enter a valid email address",
      });
      return;
    }
    const rsvp = await checkMyRSVP(rsvpEmail);
    if (!rsvp) {
      setRsvpMessage({
        type: "error",
        text: "No invitation found for this email",
      });
    } else {
      setRsvpMessage({
        type: "success",
        text: `Your current status: ${rsvp.status}`,
      });
    }
  };

  // Mark attendance (organizer only)
  const handleMarkAttendance = async (rsvpId, attended) => {
    try {
      await axios.post(
        `${API_URL}/api/events/${id}/attendance`,
        { rsvpId, attended },
        { withCredentials: true },
      );
      // Refresh the list
      fetchAttendanceList();
    } catch (error) {
      alert("Failed to mark attendance");
    }
  };

  const handlePayment = async () => {
    const finalAmount = Number(customAmount);
    if (!finalAmount || finalAmount <= 0) {
      alert("Please select or enter a valid amount");
      return;
    }

    try {
      const { data: orderData } = await axios.post(
        `${API_URL}/api/payment/create-order`,
        {
          eventId: id,
          amount: finalAmount,
        },
      );

      if (!orderData.success) {
        alert("Server error creating order");
        return;
      }

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_change_this",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "GiftSutra",
        description: `Gift for ${event.title}`,
        order_id: orderData.orderId,
        handler: async function (response) {
          try {
            const verifyData = await axios.post(
              `${API_URL}/api/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                eventId: id,
                amount: finalAmount,
              },
            );

            if (verifyData.data.success) {
              alert("Payment Successful! Thank you for the gift.");
              window.location.reload();
            } else {
              alert("Payment verification failed.");
            }
          } catch (err) {
            console.error("Verify error", err);
            alert("Payment verified but saving transaction failed!");
          }
        },
        prefill: {
          name: "",
          email: "",
          contact: "",
        },
        theme: {
          color: "#7e22ce",
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      console.error("Payment error", error);
      alert("Error initiating payment");
    }
  };

  if (loading)
    return (
      <div className="text-center mt-10 text-purple-600 font-bold">
        Loading Event...
      </div>
    );

  if (passcodeRequired) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-purple-100 text-center">
        <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-8 w-8"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8V7"
            />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Private Event</h2>
        <p className="text-gray-500 mb-8">
          Please enter the secret key to access this event.
        </p>
        <form onSubmit={handlePasscodeSubmit}>
          <input
            type="text"
            value={passcodeInput}
            onChange={(e) => setPasscodeInput(e.target.value)}
            placeholder="Enter Passcode"
            className="w-full border-2 border-purple-200 rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md"
          >
            Unlock Event
          </button>
        </form>
      </div>
    );
  }

  if (!event)
    return (
      <div className="text-center mt-10 text-gray-500 font-medium">
        Event not found
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 flex flex-col lg:flex-row gap-10">
      {/* Event Info */}
      <div className="flex-1">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-purple-100">
          <div className="h-64 sm:h-80 bg-purple-200">
            {event.coverImage ? (
              <img
                src={event.coverImage}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center">
                <h2 className="text-white text-4xl font-bold opacity-80">
                  {event.title}
                </h2>
              </div>
            )}
          </div>
          <div className="p-8">
            <h1 className="text-4xl font-extrabold text-gray-900 mb-4">
              {event.title}
            </h1>
            <p className="text-lg text-purple-700 font-semibold mb-6">
              🗓️ {new Date(event.date).toDateString()}
            </p>
            <p className="text-gray-600 leading-relaxed mb-8">
              {event.description}
            </p>

            {isOrganizer && (
              <div className="border-t pt-6 mt-6">
                <div className="flex justify-between items-center mb-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Gifted Amount</p>
                    <p className="text-3xl font-bold text-purple-600">
                      ₹{event.collectedAmount}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      const link = `${window.location.origin}/events/${event._id}${event.passcode ? `?passcode=${event.passcode}` : ""}`;
                      navigator.clipboard.writeText(link);
                      alert("Invite Link Copied! Send it to your guests.");
                    }}
                    className="bg-purple-100 text-purple-700 hover:bg-purple-200 py-2 px-4 rounded-lg font-bold transition-colors flex items-center shadow-sm"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                      />
                    </svg>
                    Copy Invite Link
                  </button>
                </div>

                {/* Email Invitation Section */}
                <div className="bg-purple-50 rounded-xl p-6 mt-4">
                  <h3 className="text-lg font-bold text-purple-900 mb-3 flex items-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Invite by Email
                  </h3>
                  <form onSubmit={handleSendInvite} className="flex gap-2">
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Enter guest email"
                      className="flex-1 border-2 border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                      disabled={sendingInvite}
                    />
                    <button
                      type="submit"
                      disabled={sendingInvite}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center shadow-sm"
                    >
                      {sendingInvite ? (
                        <svg
                          className="animate-spin h-5 w-5"
                          xmlns="http://www.w3.org/2000/svg"
                          fill="none"
                          viewBox="0 0 24 24"
                        >
                          <circle
                            className="opacity-25"
                            cx="12"
                            cy="12"
                            r="10"
                            stroke="currentColor"
                            strokeWidth="4"
                          ></circle>
                          <path
                            className="opacity-75"
                            fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                          ></path>
                        </svg>
                      ) : (
                        <>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 mr-1"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth="2"
                              d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                            />
                          </svg>
                          Send
                        </>
                      )}
                    </button>
                  </form>
                  {inviteMessage && (
                    <p
                      className={`mt-2 text-sm ${inviteMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
                    >
                      {inviteMessage.text}
                    </p>
                  )}
                </div>

                {/* Attendance Tracking Section */}
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 mt-4">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-purple-900 flex items-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 mr-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                        />
                      </svg>
                      Attendance Tracking
                    </h3>
                    <button
                      onClick={() => setShowAttendance(!showAttendance)}
                      className="text-purple-600 hover:text-purple-800 font-semibold text-sm"
                    >
                      {showAttendance ? "Hide" : "Show"} Details
                    </button>
                  </div>

                  {attendanceStats && (
                    <div className="grid grid-cols-3 gap-2 mb-4">
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <p className="text-2xl font-bold text-green-600">
                          {attendanceStats.attended}
                        </p>
                        <p className="text-xs text-gray-500">Attended</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <p className="text-2xl font-bold text-red-600">
                          {attendanceStats.noShow}
                        </p>
                        <p className="text-xs text-gray-500">No Show</p>
                      </div>
                      <div className="bg-white rounded-lg p-3 text-center shadow-sm">
                        <p className="text-2xl font-bold text-blue-600">
                          {attendanceStats.accepted}
                        </p>
                        <p className="text-xs text-gray-500">Accepted</p>
                      </div>
                    </div>
                  )}

                  {showAttendance && (
                    <div className="mt-4">
                      {attendanceLoading ? (
                        <div className="text-center py-4">
                          <svg
                            className="animate-spin h-6 w-6 mx-auto text-purple-600"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                        </div>
                      ) : (
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {attendanceList.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">
                              No invitations sent yet
                            </p>
                          ) : (
                            attendanceList.map((rsvp) => (
                              <div
                                key={rsvp._id}
                                className="bg-white rounded-lg p-3 flex justify-between items-center shadow-sm"
                              >
                                <div>
                                  <p className="font-semibold text-sm">
                                    {rsvp.email}
                                  </p>
                                  <p className="text-xs text-gray-500">
                                    Status:{" "}
                                    <span
                                      className={`font-medium ${
                                        rsvp.status === "attended"
                                          ? "text-green-600"
                                          : rsvp.status === "no_show"
                                            ? "text-red-600"
                                            : rsvp.status === "accepted"
                                              ? "text-blue-600"
                                              : rsvp.status === "declined"
                                                ? "text-gray-600"
                                                : "text-yellow-600"
                                      }`}
                                    >
                                      {rsvp.status}
                                    </span>
                                  </p>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() =>
                                      handleMarkAttendance(rsvp._id, true)
                                    }
                                    className={`p-2 rounded-lg text-xs font-bold ${
                                      rsvp.status === "attended"
                                        ? "bg-green-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-green-100"
                                    }`}
                                    title="Mark as Attended"
                                  >
                                    ✓
                                  </button>
                                  <button
                                    onClick={() =>
                                      handleMarkAttendance(rsvp._id, false)
                                    }
                                    className={`p-2 rounded-lg text-xs font-bold ${
                                      rsvp.status === "no_show"
                                        ? "bg-red-600 text-white"
                                        : "bg-gray-100 text-gray-600 hover:bg-red-100"
                                    }`}
                                    title="Mark as No Show"
                                  >
                                    ✗
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Gift & RSVP */}
      <div className="w-full lg:w-96 space-y-6">
        {/* RSVP Section for Non-Organizers */}
        {!isOrganizer && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
            <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              RSVP
            </h2>

            <form onSubmit={handleCheckRSVP} className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Enter your email to check invitation
              </label>
              <div className="flex gap-2">
                <input
                  type="email"
                  value={rsvpEmail}
                  onChange={(e) => setRsvpEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="flex-1 border-2 border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                />
                <button
                  type="submit"
                  className="bg-purple-100 text-purple-700 hover:bg-purple-200 py-2 px-4 rounded-lg font-bold transition-colors"
                >
                  Check
                </button>
              </div>
            </form>

            {myRSVP && (
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Current status:{" "}
                  <span className="font-bold text-purple-700 capitalize">
                    {myRSVP.status}
                  </span>
                </p>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => handleRSVP("accepted")}
                    disabled={rsvpLoading}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                      myRSVP.status === "accepted"
                        ? "bg-green-600 text-white"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleRSVP("maybe")}
                    disabled={rsvpLoading}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                      myRSVP.status === "maybe"
                        ? "bg-yellow-600 text-white"
                        : "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                    }`}
                  >
                    Maybe
                  </button>
                  <button
                    onClick={() => handleRSVP("declined")}
                    disabled={rsvpLoading}
                    className={`py-2 px-3 rounded-lg text-sm font-bold transition-colors ${
                      myRSVP.status === "declined"
                        ? "bg-red-600 text-white"
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    Decline
                  </button>
                </div>
              </div>
            )}

            {rsvpMessage && (
              <p
                className={`mt-3 text-sm ${rsvpMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
              >
                {rsvpMessage.text}
              </p>
            )}
          </div>
        )}

        {/* Gift Section */}
        <div className="bg-white rounded-2xl shadow-xl p-8 sticky top-10 border border-purple-100">
          <h2 className="text-2xl font-bold text-purple-900 mb-6 flex items-center">
            🎁 Send a Gift
          </h2>

          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Enter Amount
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-bold">
                ₹
              </span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-colors text-lg font-bold"
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-4">
            <button
              onClick={handlePayment}
              className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold text-white text-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Send Gift with Google Pay</span>
            </button>
            <button
              onClick={handlePayment}
              className="w-full flex items-center justify-center space-x-2 py-4 rounded-xl font-bold text-purple-700 text-lg bg-purple-50 hover:bg-purple-100 border-2 border-purple-200 shadow-sm transition-all transform hover:-translate-y-1"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                />
              </svg>
              <span>Other Payment Options</span>
            </button>
          </div>
          <p className="text-xs text-center text-gray-400 mt-4">
            Securely processed by Razorpay
          </p>
        </div>
      </div>
    </div>
  );
};

export default EventDetails;
