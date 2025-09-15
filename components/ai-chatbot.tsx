"use client"

import { useState } from "react"
import { useChat } from "ai/react"
import { MessageCircle, Send, X, Bot, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"

export function AIChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    api: "/api/chat",
    initialMessages: [
      {
        id: "welcome",
        role: "assistant",
        content:
          "Hello! I'm your MediCal Assistant. I can help you with questions about your medications, scheduling, and using the app. How can I assist you today?",
      },
    ],
  })

  const toggleChat = () => setIsOpen(!isOpen)

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={toggleChat}
          size="lg"
          className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-shadow"
        >
          {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        </Button>
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 z-40 w-96 max-w-[calc(100vw-2rem)]">
          <Card className="shadow-2xl border-2">
            <CardHeader className="bg-primary text-primary-foreground rounded-t-lg">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Bot className="h-5 w-5" />
                MediCal Assistant
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {/* Messages */}
              <ScrollArea className="h-96 p-4">
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                    >
                      {message.role === "assistant" && (
                        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                          <Bot className="h-4 w-4 text-primary-foreground" />
                        </div>
                      )}
                      <div
                        className={`max-w-[80%] p-3 rounded-lg text-sm ${
                          message.role === "user"
                            ? "bg-primary text-primary-foreground ml-auto"
                            : "bg-muted text-foreground"
                        }`}
                      >
                        {message.content}
                      </div>
                      {message.role === "user" && (
                        <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                          <User className="h-4 w-4 text-secondary-foreground" />
                        </div>
                      )}
                    </div>
                  ))}
                  {isLoading && (
                    <div className="flex gap-3 justify-start">
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4 text-primary-foreground" />
                      </div>
                      <div className="bg-muted text-foreground p-3 rounded-lg text-sm">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.1s" }}
                          ></div>
                          <div
                            className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce"
                            style={{ animationDelay: "0.2s" }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>

              {/* Input */}
              <div className="border-t p-4">
                <form onSubmit={handleSubmit} className="flex gap-2">
                  <Input
                    value={input}
                    onChange={handleInputChange}
                    placeholder="Ask about your medications..."
                    disabled={isLoading}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={isLoading || !input.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Always consult your doctor for medical advice
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  )
}
