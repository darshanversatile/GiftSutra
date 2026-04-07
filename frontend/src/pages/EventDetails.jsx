import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";
const RAZORPAY_ENABLED = !!import.meta.env.VITE_RAZORPAY_KEY_ID;

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
  const [manualGiftAmount, setManualGiftAmount] = useState("");
  const [manualGiftName, setManualGiftName] = useState("");
  const [manualGiftNote, setManualGiftNote] = useState("");
  const [manualGiftMethod, setManualGiftMethod] = useState("Cash");
  const [manualGiftLoading, setManualGiftLoading] = useState(false);
  const [manualGiftMessage, setManualGiftMessage] = useState(null);

  // RSVP States
  const [rsvpEmail, setRsvpEmail] = useState("");
  const [myRSVP, setMyRSVP] = useState(null);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpMessage, setRsvpMessage] = useState(null);
  const [joinLoading, setJoinLoading] = useState(false);

  // Attendance States (for organizer)
  const [attendanceList, setAttendanceList] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState(null);
  const [showAttendance, setShowAttendance] = useState(false);
  const [attendanceLoading, setAttendanceLoading] = useState(false);
  const [giftList, setGiftList] = useState([]);
  const [giftsLoading, setGiftsLoading] = useState(false);
  const [copyInviteMessage, setCopyInviteMessage] = useState(null);
  const normalizedUserId = user?._id?.toString?.() || user?.id?.toString?.() || "";
  const normalizedOrganizerId =
    event?.organizer?._id?.toString?.() || event?.organizer?.id?.toString?.() || "";
  const normalizedUserEmail = user?.email?.toLowerCase?.() || "";
  const normalizedOrganizerEmail = event?.organizer?.email?.toLowerCase?.() || "";
  const isOrganizer =
    !!user &&
    !!event &&
    (
      (normalizedUserId && normalizedOrganizerId && normalizedUserId === normalizedOrganizerId) ||
      (normalizedUserEmail && normalizedOrganizerEmail && normalizedUserEmail === normalizedOrganizerEmail)
    );
  const hasJoinedEvent = myRSVP?.status === "accepted";
  const canMakePayment = !isOrganizer && hasJoinedEvent;

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

  const fetchGiftList = async (passcodeOverride = "") => {
    try {
      setGiftsLoading(true);
      const headers = passcodeOverride
        ? { "x-passcode": passcodeOverride }
        : {};
      const { data } = await axios.get(`${API_URL}/api/events/${id}/gifts`, {
        headers,
        withCredentials: true,
      });
      setGiftList(data);
    } catch (error) {
      console.error("Failed to fetch gift list", error);
    } finally {
      setGiftsLoading(false);
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
    if (!event) {
      return;
    }

    if (!isOrganizer) {
      setGiftList([]);
      setGiftsLoading(false);
      return;
    }

    fetchGiftList();
  }, [event, id, isOrganizer]);

  useEffect(() => {
    if (showAttendance && isOrganizer) {
      fetchAttendanceList();
    }
  }, [showAttendance, id, isOrganizer]);

  useEffect(() => {
    if (!user?.email || isOrganizer) {
      return;
    }

    setRsvpEmail(user.email);
    checkMyRSVP(user.email);
  }, [user, isOrganizer, id]);

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

  const handleJoinEvent = async () => {
    if (!user?.email) {
      setRsvpMessage({
        type: "error",
        text: "Please log in with a valid email account to join this event.",
      });
      return;
    }

    setJoinLoading(true);
    setRsvpMessage(null);

    try {
      const { data } = await axios.post(
        `${API_URL}/api/events/${id}/join`,
        { passcode: passcodeInput || undefined },
        { withCredentials: true },
      );
      setRsvpEmail(user.email);
      setMyRSVP(data.rsvp);
      setRsvpMessage({
        type: "success",
        text: data.message || "You joined the event successfully.",
      });
    } catch (error) {
      setRsvpMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to join the event",
      });
    } finally {
      setJoinLoading(false);
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
    if (isOrganizer) {
      alert("Organizers cannot make payments for their own event.");
      return;
    }

    if (!hasJoinedEvent) {
      alert("Please join the event before making a payment.");
      return;
    }

    if (!RAZORPAY_ENABLED) {
      alert("Online payments are not enabled yet.");
      return;
    }

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
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
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

  const handleManualGiftSubmit = async (e) => {
    e.preventDefault();

    const amount = Number(manualGiftAmount);
    if (!amount || amount <= 0) {
      setManualGiftMessage({
        type: "error",
        text: "Please enter a valid gift amount",
      });
      return;
    }

    try {
      setManualGiftLoading(true);
      setManualGiftMessage(null);

      const { data } = await axios.post(
        `${API_URL}/api/payment/manual`,
        {
          eventId: id,
          amount,
          donorName: manualGiftName,
          note: manualGiftNote,
          paymentMethod: manualGiftMethod,
        },
        { withCredentials: true },
      );

      setEvent((currentEvent) =>
        currentEvent
          ? { ...currentEvent, collectedAmount: data.collectedAmount }
          : currentEvent,
      );
      setGiftList((currentGifts) => [
        {
          _id: data.transaction._id,
          amount: data.transaction.amount,
          paymentMethod: data.transaction.paymentMethod,
          note: data.transaction.note,
          entryType: data.transaction.entryType,
          createdAt: data.transaction.createdAt,
          contributorName: data.transaction.donorName || "Anonymous",
          contributorEmail: "",
        },
        ...currentGifts,
      ]);
      setManualGiftAmount("");
      setManualGiftName("");
      setManualGiftNote("");
      setManualGiftMethod("Cash");
      setManualGiftMessage({
        type: "success",
        text: "Manual gift entry added successfully",
      });
    } catch (error) {
      setManualGiftMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to add manual gift",
      });
    } finally {
      setManualGiftLoading(false);
    }
  };

  const buildInviteLink = () => {
    const inviteUrl = new URL(`/events/${event._id}`, window.location.origin);
    if (event.passcode) {
      inviteUrl.searchParams.set("passcode", event.passcode);
    }
    return inviteUrl.toString();
  };

  const fallbackCopyToClipboard = (text) => {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.setAttribute("readonly", "");
    textArea.style.position = "fixed";
    textArea.style.top = "-9999px";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    let copied = false;
    try {
      copied = document.execCommand("copy");
    } catch (error) {
      copied = false;
    }

    document.body.removeChild(textArea);
    return copied;
  };

  const handleCopyInviteLink = async () => {
    const link = buildInviteLink();

    try {
      if (navigator?.clipboard?.writeText && window.isSecureContext) {
        await navigator.clipboard.writeText(link);
      } else {
        const copied = fallbackCopyToClipboard(link);
        if (!copied) {
          throw new Error("Clipboard API unavailable");
        }
      }

      setCopyInviteMessage({
        type: "success",
        text: "Invite link copied. Share it with your guests.",
      });
    } catch (error) {
      setCopyInviteMessage({
        type: "error",
        text: "Auto-copy is blocked on this browser. A manual copy dialog will open.",
      });
      window.prompt("Copy this invite link:", link);
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

            {!isOrganizer && (
              <div className="mb-8 rounded-2xl border border-purple-200 bg-purple-50 px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-purple-900">
                      Joining as {user?.email || "your account"}
                    </p>
                    <p className="text-sm text-purple-700">
                      Tap below to join this event from your account.
                    </p>
                  </div>
                  <button
                    onClick={handleJoinEvent}
                    disabled={joinLoading || myRSVP?.status === "accepted"}
                    className={`rounded-xl px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors ${
                      joinLoading || myRSVP?.status === "accepted"
                        ? "bg-green-600 cursor-not-allowed"
                        : "bg-purple-600 hover:bg-purple-700"
                    }`}
                  >
                    {joinLoading
                      ? "Joining..."
                      : myRSVP?.status === "accepted"
                        ? "Joined"
                        : "Join Event"}
                  </button>
                </div>
              </div>
            )}

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
                    onClick={handleCopyInviteLink}
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
                {copyInviteMessage && (
                  <p
                    className={`mb-4 text-sm ${copyInviteMessage.type === "success" ? "text-green-600" : "text-amber-600"}`}
                  >
                    {copyInviteMessage.text}
                  </p>
                )}

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

                <div className="bg-white rounded-xl p-6 mt-4 border border-purple-100 shadow-sm">
                  <h3 className="text-lg font-bold text-purple-900 mb-3">
                    Add Manual Gift Entry
                  </h3>
                  <form onSubmit={handleManualGiftSubmit} className="space-y-3">
                    <input
                      type="text"
                      value={manualGiftName}
                      onChange={(e) => setManualGiftName(e.target.value)}
                      placeholder="Donor name (optional)"
                      className="w-full border-2 border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                      disabled={manualGiftLoading}
                    />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <input
                        type="number"
                        min="1"
                        step="0.01"
                        value={manualGiftAmount}
                        onChange={(e) =>
                          setManualGiftAmount(e.target.value.startsWith("-") ? "" : e.target.value)
                        }
                        placeholder="Amount"
                        className="w-full border-2 border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                        disabled={manualGiftLoading}
                      />
                      <select
                        value={manualGiftMethod}
                        onChange={(e) => setManualGiftMethod(e.target.value)}
                        className="w-full border-2 border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                        disabled={manualGiftLoading}
                      >
                        <option value="Cash">Cash</option>
                        <option value="Bank Transfer">Bank Transfer</option>
                        <option value="UPI">UPI</option>
                        <option value="Cheque">Cheque</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <textarea
                      value={manualGiftNote}
                      onChange={(e) => setManualGiftNote(e.target.value)}
                      placeholder="Note (optional)"
                      rows="3"
                      className="w-full border-2 border-purple-200 rounded-lg px-4 py-2 focus:ring-2 focus:ring-purple-500 outline-none transition-colors"
                      disabled={manualGiftLoading}
                    />
                    <button
                      type="submit"
                      disabled={manualGiftLoading}
                      className="bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-sm"
                    >
                      {manualGiftLoading ? "Saving..." : "Add Manual Gift"}
                    </button>
                  </form>
                  {manualGiftMessage && (
                    <p
                      className={`mt-3 text-sm ${manualGiftMessage.type === "success" ? "text-green-600" : "text-red-600"}`}
                    >
                      {manualGiftMessage.text}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Sidebar - Gift & RSVP */}
      <div className="w-full lg:w-96 space-y-6">
        {isOrganizer && (
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-purple-100">
            <h2 className="text-2xl font-bold text-purple-900 mb-6">
              Contributions
            </h2>
            {giftsLoading ? (
              <p className="text-sm text-gray-500">Loading contributions...</p>
            ) : giftList.length === 0 ? (
              <p className="text-sm text-gray-500">
                No gifts have been recorded yet.
              </p>
            ) : (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {giftList.map((gift) => (
                  <div
                    key={gift._id}
                    className="rounded-xl border border-purple-100 bg-purple-50/40 px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-semibold text-gray-900">
                          {gift.contributorName}
                        </p>
                        {gift.contributorEmail && (
                          <p className="text-xs text-gray-500">
                            {gift.contributorEmail}
                          </p>
                        )}
                        <p className="text-xs text-gray-500 mt-1">
                          {gift.entryType === "manual"
                            ? `Manual entry via ${gift.paymentMethod}`
                            : gift.paymentMethod}
                        </p>
                        {gift.note && (
                          <p className="text-xs text-gray-600 mt-1">
                            Note: {gift.note}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-purple-700">
                          Rs. {gift.amount}
                        </p>
                        <p className="text-xs text-gray-400">
                          {new Date(gift.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

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

            <button
              onClick={handleJoinEvent}
              disabled={joinLoading || myRSVP?.status === "accepted"}
              className={`mb-4 w-full rounded-xl py-3 text-sm font-bold text-white transition-colors ${
                joinLoading || myRSVP?.status === "accepted"
                  ? "bg-green-600 cursor-not-allowed"
                  : "bg-purple-600 hover:bg-purple-700"
              }`}
            >
              {joinLoading
                ? "Joining..."
                : myRSVP?.status === "accepted"
                  ? "Joined This Event"
                  : "Join Event"}
            </button>

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

        {canMakePayment && (
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
                  min="1"
                  step="0.01"
                  value={customAmount}
                  onChange={(e) =>
                    setCustomAmount(e.target.value.startsWith("-") ? "" : e.target.value)
                  }
                  className="w-full pl-10 pr-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-purple-500 focus:bg-white transition-colors text-lg font-bold"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="space-y-4">
              <button
                onClick={handlePayment}
                disabled={!RAZORPAY_ENABLED}
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
                disabled={!RAZORPAY_ENABLED}
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
              {RAZORPAY_ENABLED
                ? "Securely processed by Razorpay"
                : "Online payments will be enabled later"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default EventDetails;
