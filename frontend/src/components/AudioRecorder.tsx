import { useRef, useState, ReactNode } from "react";
import { Button, Icon, useToast } from "@chakra-ui/react";
import { FaMicrophone, FaStop } from "react-icons/fa";

interface AudioRecorderProps {
  onTranscript: (text: string) => void;
  onFinish?: () => void;          // optional callback after transcription
  children?: ReactNode;           // optional custom trigger element
}

const AudioRecorder = ({ onTranscript, onFinish, children }: AudioRecorderProps) => {
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const toast = useToast();

  // ── Toggle Recording ────────────────────────────────────────────
  const handleRecord = async () => {
    // Stop current recording
    if (recording) {
      mediaRecorderRef.current?.stop();
      setRecording(false);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
      });

      chunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size) chunksRef.current.push(e.data);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());

        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("file", blob, "recording.webm");

        try {
          const res = await fetch("http://localhost:8000/transcribe", {
            method: "POST",
            body: formData,
          });
          const data = await res.json();

          if (data.english) onTranscript(data.english);
          else toast({ status: "error", title: "No transcript returned." });
        } catch (err) {
          console.error(err);
          toast({ status: "error", title: "Transcription failed." });
        } finally {
          onFinish?.();
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setRecording(true);
    } catch {
      toast({ status: "error", title: "Microphone permission denied." });
    }
  };

  // ── Render ──────────────────────────────────────────────────────
  if (children) {
    return (
      <span onClick={handleRecord} style={{ cursor: "pointer" }}>
        {children}
      </span>
    );
  }

  return (
    <Button
      onClick={handleRecord}
      colorScheme={recording ? "red" : "teal"}
      leftIcon={<Icon as={recording ? FaStop : FaMicrophone} />}
      variant={recording ? "solid" : "outline"}
      size="lg"
    >
      {recording ? "Stop" : "Speak"}
    </Button>
  );
};

export default AudioRecorder;
