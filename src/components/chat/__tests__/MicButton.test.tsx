import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import MicButton from "../MicButton";

// Mock the Web Speech API
const mockStart = jest.fn();
const mockStop = jest.fn();

class MockSpeechRecognition {
  continuous = false;
  interimResults = false;
  start = mockStart;
  stop = mockStop;
  onresult: any = null;
  onerror: any = null;
  onend: any = null;

  // Simulate starting recognition
  triggerStart() {
    this.start();
  }

  // Simulate result event
  triggerResult(transcript: string) {
    if (this.onresult) {
      this.onresult({
        results: [
          [{ transcript }]
        ]
      });
    }
  }

  // Simulate error event
  triggerError(error: string) {
    if (this.onerror) {
      this.onerror({ error });
    }
  }

  // Simulate end event
  triggerEnd() {
    if (this.onend) {
      this.onend();
    }
  }
}

describe("MicButton", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // @ts-ignore
    window.SpeechRecognition = MockSpeechRecognition;
    // @ts-ignore
    window.webkitSpeechRecognition = MockSpeechRecognition;
  });

  afterEach(() => {
    // @ts-ignore
    delete window.SpeechRecognition;
    // @ts-ignore
    delete window.webkitSpeechRecognition;
  });

  it("renders the microphone button", () => {
    const handleUpdate = jest.fn();
    render(<MicButton currentText="" onUpdate={handleUpdate} />);
    
    const button = screen.getByRole("button");
    expect(button).toBeInTheDocument();
  });

  it("starts listening when clicked", () => {
    const handleUpdate = jest.fn();
    render(<MicButton currentText="" onUpdate={handleUpdate} />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(mockStart).toHaveBeenCalled();
  });

  it("shows alert if Speech Recognition is not supported", () => {
    // Remove the mock to simulate unsupported browser
    // @ts-ignore
    delete window.SpeechRecognition;
    // @ts-ignore
    delete window.webkitSpeechRecognition;

    const alertSpy = jest.spyOn(window, "alert").mockImplementation(() => {});
    const handleUpdate = jest.fn();
    
    render(<MicButton currentText="" onUpdate={handleUpdate} />);
    
    const button = screen.getByRole("button");
    fireEvent.click(button);
    
    expect(alertSpy).toHaveBeenCalledWith("Speech recognition isn't supported in this browser. Use Chrome or Edge.");
    alertSpy.mockRestore();
  });
});
