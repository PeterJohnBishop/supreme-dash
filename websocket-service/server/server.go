package server

import (
	"fmt"
	"log"
	"os"
	"supreme-dash/server/websocket"
	"time"

	"github.com/gin-gonic/gin"
)

var hub *websocket.Hub

func ServeGin() {
	log.Println("Ordering Gin")
	gin.SetMode(gin.ReleaseMode)
	r := gin.Default()
	r.Use(gin.LoggerWithFormatter(func(param gin.LogFormatterParams) string {
		return fmt.Sprintf("%s - [%s] \"%s %s %s %d %s \"%s\" %s\"\n",
			param.ClientIP,
			param.TimeStamp.Format(time.RFC1123),
			param.Method,
			param.Path,
			param.Request.Proto,
			param.StatusCode,
			param.Latency,
			param.Request.UserAgent(),
			param.ErrorMessage,
		)
	}))
	r.Use(gin.Recovery())

	r.GET("/ping", func(c *gin.Context) {
		c.String(200, "pong")
	})

	hub = websocket.NewHub()

	r.GET("/ws", func(c *gin.Context) {
		websocket.HandleWebsocket(hub, c)
	})

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	config := fmt.Sprintf(":%s", port)
	log.Printf("Serving Gin on port :%s", port)
	r.Run(config)
}
