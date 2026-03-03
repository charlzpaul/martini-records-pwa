import React, { useState, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Coffee, MessageCircle, Send, QrCode } from "lucide-react";
import { toast } from "sonner";

export function SupportDialog() {
  const [feedback, setFeedback] = useState({ subject: '', message: '' });
  const [open, setOpen] = useState(false);
  
  // Basic mobile detection
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
  }, []);

  const [showQr, setShowQr] = useState(!isMobile);

  const handleFeedbackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const recipient = "feedback.martinirecords@gmail.com";
    const subject = encodeURIComponent(`[Invoice App Feedback] ${feedback.subject}`);
    const body = encodeURIComponent(feedback.message);
    window.location.href = `mailto:${recipient}?subject=${subject}&body=${body}`;
    toast.success("Opening email client...");
    setFeedback({ subject: '', message: '' });
    setOpen(false);
  };

  const upiId = "8590143787@ybl.com";
  const name = "Martini Records";
  const amount = "100.00";
  const note = "App Support";
  
  const upiUrlMobile = `upi://pay?pa=${upiId}&pn=${name.replace(/\s+/g, '%20')}&am=${amount}&cu=INR&tn=${note.replace(/\s+/g, '%20')}`;
  const upiUrlQr = `upi://pay?pa=${upiId}&pn=${name.replace(/\s+/g, '%20')}&cu=INR&tn=${note.replace(/\s+/g, '%20')}`;

  const handleUpiDonation = () => {
    if (isMobile) {
      window.location.href = upiUrlMobile;
      toast.info("Opening UPI app...");
    } else {
      setShowQr(true);
      toast.info("Please scan the QR code with your mobile app.");
    }
  };

  const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(upiUrlQr)}&size=200&margin=1&ecLevel=M`;

  return (
    <Dialog open={open} onOpenChange={(val) => {
      setOpen(val);
      if (val) setShowQr(!isMobile);
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 px-2 sm:px-3">
          <MessageCircle className="h-4 w-4" />
          <span className="hidden sm:inline">Support & Feedback</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Support & Feedback</DialogTitle>
          <DialogDescription>
            Help keep this app free and share your thoughts!
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          <div className="space-y-4 rounded-lg border p-4 bg-muted/50">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Coffee className="h-4 w-4 text-yellow-600" />
                Support the Development
              </h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 px-2 text-[10px]"
                onClick={() => setShowQr(!showQr)}
              >
                <QrCode className="h-3 w-3 mr-1" />
                {showQr ? "Hide QR" : "Show QR"}
              </Button>
            </div>
            
            {showQr ? (
              <div className="flex flex-col items-center gap-3 py-2 animate-in fade-in zoom-in duration-300">
                <div className="bg-white p-3 rounded-xl shadow-md border">
                  <img src={qrImageUrl} alt="UPI QR Code" className="h-[180px] w-[180px]" />
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-mono text-muted-foreground">{upiId}</p>
                  <p className="text-[10px] text-muted-foreground italic">Scan with GPay, PhonePe, or Paytm</p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground leading-relaxed">
                Found the app useful? Support development with a one-time donation of ₹100.
              </p>
            )}

            <Button 
              className="w-full bg-green-600 hover:bg-green-700 text-white font-bold"
              onClick={handleUpiDonation}
            >
              {isMobile ? "Pay ₹100 via UPI App" : "Scan QR to Pay"}
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Or share feedback</span>
            </div>
          </div>

          <form onSubmit={handleFeedbackSubmit} className="space-y-4">
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="subject">Subject</Label>
              <Input 
                id="subject" 
                placeholder="Bug report, feature request..." 
                value={feedback.subject}
                onChange={(e) => setFeedback({...feedback, subject: e.target.value})}
                required
              />
            </div>
            <div className="grid w-full items-center gap-1.5">
              <Label htmlFor="message">Message</Label>
              <Textarea 
                id="message" 
                placeholder="Describe your feedback here..." 
                className="min-h-[100px]"
                value={feedback.message}
                onChange={(e) => setFeedback({...feedback, message: e.target.value})}
                required
              />
            </div>
            <Button type="submit" className="w-full gap-2">
              <Send className="h-4 w-4" />
              Send Feedback
            </Button>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
