import { useState, useEffect, useRef } from "react";
import {
  Box,
  Drawer,
  Typography,
  TextField,
  IconButton,
  Paper,
  CircularProgress,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import { SensorData } from "@/utils/sensorHelpers";
import { useApi } from "@/utils/api";
import { useBackend } from "@/contexts/BackendContext";
import OpenAI from "openai";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
}

interface SensorDetails {
  // Add the actual types from your SensorDetails component
  [key: string]: any;
}

interface GraphData {
  // Add the actual types from your SensorGraph component
  [key: string]: any;
}

interface ChatPanelProps {
  open: boolean;
  onClose: () => void;
  sensor: SensorData;
}

export default function ChatPanel({ open, onClose, sensor }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sensorDetails, setSensorDetails] = useState<SensorDetails | null>(
    null
  );
  const [graphData, setGraphData] = useState<GraphData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { fetchWithAuth } = useApi();
  const { apiURL } = useBackend();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const openai = new OpenAI({
    apiKey:
      "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",
    dangerouslyAllowBrowser: true,
  });

  useEffect(() => {
    const fetchSensorData = async () => {
      setIsLoading(true);
      try {
        // Fetch sensor details
        const detailsResponse = await fetchWithAuth(
          apiURL(
            `sensors/details?sensor_id=${sensor.sensor_id}`,
            `sensors/details/${sensor.sensor_id}`
          )
        );
        const detailsData = await detailsResponse.json();
        setSensorDetails(detailsData);

        // Fetch graph data
        const graphResponse = await fetchWithAuth(
          apiURL(
            `sensors/graph?sensor_id=${sensor.sensor_id}&date_range=1h`,
            `sensors/graph/${sensor.sensor_id}`
          )
        );
        const graphData = await graphResponse.json();
        setGraphData(graphData);
      } catch (error) {
        console.error("Error fetching sensor data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      fetchSensorData();
    }
  }, [open, sensor]);

  const getSystemMessage = () => {
    const baseMessage = `You are SentinelAI, a smart assistant for users of this web platform. 
    Your purpose is to provide detailed information and assistance about sensor "${sensor.sensor_name}". 
    This platform monitors live sensor data from various locations like hospitals and schools, providing real-time insights and alerts.
    You can help users understand sensor readings, troubleshoot issues, and provide context about the sensor's purpose and location.
    A sensor gap is a period of time when the sensor is not reporting data.
    That is happening when the interval between two data points is greater than the sampling period of that sensor.

    Please follow these guidelines:
    1. Keep responses short and concise - aim for 2-3 sentences maximum
    2. Format dates as "dd MMM, HH:mm" (e.g., "15 Mar, 14:30")
    3. Use Markdown for better readability:
       - Use **bold** for important information
       - Use *italic* for emphasis
       - Use \`code\` for technical terms or values
       - Use bullet points for lists
       - Use \`\`\` for code blocks
       - Use > for important notes or warnings
       - Use headers (#) for section titles`;

    let additionalContext = "";

    if (sensorDetails) {
      additionalContext += `\n\nSensor Details:\n${JSON.stringify(
        sensorDetails,
        null,
        2
      )}`;
    }

    if (graphData) {
      additionalContext += `\n\nGraph Data:\n${JSON.stringify(
        graphData,
        null,
        2
      )}`;
    }

    return baseMessage + additionalContext;
  };

  useEffect(() => {
    if (open) {
      // Add system message and welcome message when chat is opened
      setMessages([
        {
          role: "system",
          content: getSystemMessage(),
        },
        {
          role: "assistant",
          content: `👋 Hi! I'm **SentinelAI**, your smart assistant for sensor "${sensor.sensor_name}". I can help you understand sensor readings, troubleshoot issues, and provide insights about this sensor. What would you like to know?`,
        },
      ]);
    } else {
      // Clear messages when chat is closed
      setMessages([]);
      setSensorDetails(null);
      setGraphData(null);
    }
  }, [open, sensor, sensorDetails, graphData]);

  const handleSend = async () => {
    if (!input.trim()) return;

    // Add user message
    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setIsSending(true);

    try {
      // Add an empty assistant message that we'll update
      const assistantMessage: Message = {
        role: "assistant",
        content: "",
      };
      setMessages((prev) => [...prev, assistantMessage]);

      const stream = await openai.chat.completions.create({
        messages: [
          {
            role: "system",
            content: messages.find((m) => m.role === "system")?.content || "",
          },
          {
            role: "user",
            content: input,
          },
        ],
        model: "gpt-4o-mini",
        stream: true,
      });

      let fullContent = "";
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || "";
        fullContent += content;
        console.log(fullContent);
        setMessages((prev) => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = {
            role: "assistant",
            content: fullContent,
          };
          return newMessages;
        });
      }
    } catch (error) {
      console.error("Error sending message:", error);
      // Add error message
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: "400px",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: "1px solid #e0e0e0",
          display: "flex",
          flexDirection: "column",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="h6">{sensor?.sensor_name}</Typography>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <CircularProgress size={16} />
            <Typography variant="caption" color="text.secondary">
              Loading sensor data...
            </Typography>
          </Box>
        )}
      </Box>

      {/* Messages */}
      <Box
        sx={{
          flex: 1,
          overflow: "auto",
          p: 2,
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        {messages.map(
          (message, index) =>
            message.role !== "system" && (
              <Paper
                key={index}
                elevation={1}
                sx={{
                  p: 2,
                  maxWidth: "80%",
                  alignSelf:
                    message.role === "user" ? "flex-end" : "flex-start",
                  backgroundColor:
                    message.role === "user" ? "#e3f2fd" : "#f5f5f5",
                  minHeight:
                    message.role === "assistant" && !message.content.trim()
                      ? "40px"
                      : "auto",
                  display: "flex",
                  alignItems: "flex-start",
                  width: "fit-content",
                }}
              >
                {message.role === "assistant" ? (
                  message.content.trim() ? (
                    <Box sx={{ width: "100%", minWidth: "200px" }}>
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => (
                            <Typography
                              variant="body1"
                              component="div"
                              sx={{
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                "& + &": { mt: 1 },
                                width: "100%",
                              }}
                            >
                              {children}
                            </Typography>
                          ),
                          ul: ({ children }) => (
                            <Box
                              component="ul"
                              sx={{
                                pl: 2,
                                my: 1,
                                "& li": { mb: 0.5 },
                                width: "100%",
                              }}
                            >
                              {children}
                            </Box>
                          ),
                          li: ({ children }) => (
                            <Typography
                              component="li"
                              variant="body1"
                              sx={{ width: "100%" }}
                            >
                              {children}
                            </Typography>
                          ),
                          h3: ({ children }) => (
                            <Typography
                              variant="h6"
                              component="h3"
                              sx={{
                                mt: 2,
                                mb: 1,
                                fontWeight: "bold",
                                width: "100%",
                              }}
                            >
                              {children}
                            </Typography>
                          ),
                          code: ({ children }) => (
                            <Typography
                              component="code"
                              sx={{
                                backgroundColor: "rgba(0,0,0,0.05)",
                                padding: "2px 4px",
                                borderRadius: "4px",
                                fontFamily: "monospace",
                                width: "100%",
                              }}
                            >
                              {children}
                            </Typography>
                          ),
                          pre: ({ children }) => (
                            <Box
                              sx={{
                                backgroundColor: "rgba(0,0,0,0.05)",
                                padding: 2,
                                borderRadius: 1,
                                overflowX: "auto",
                                my: 1,
                                width: "100%",
                              }}
                            >
                              {children}
                            </Box>
                          ),
                          em: ({ children }) => (
                            <Typography
                              component="span"
                              sx={{ fontStyle: "italic", width: "100%" }}
                            >
                              {children}
                            </Typography>
                          ),
                          strong: ({ children }) => (
                            <Typography
                              component="span"
                              sx={{ fontWeight: "bold", width: "100%" }}
                            >
                              {children}
                            </Typography>
                          ),
                        }}
                      >
                        {message.content}
                      </ReactMarkdown>
                    </Box>
                  ) : (
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Thinking...
                      </Typography>
                    </Box>
                  )
                ) : (
                  <Typography variant="body1">{message.content}</Typography>
                )}
              </Paper>
            )
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Input */}
      <Box
        sx={{
          p: 2,
          borderTop: "1px solid #e0e0e0",
          display: "flex",
          gap: 1,
        }}
      >
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          size="small"
          disabled={isSending}
        />
        <IconButton
          color="primary"
          onClick={handleSend}
          disabled={!input.trim() || isSending}
        >
          {isSending ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Drawer>
  );
}
