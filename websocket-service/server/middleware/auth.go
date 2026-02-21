package middleware

import (
	"fmt"
	"net/http"
	"os"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v5"
)

func AuthMiddleware() gin.HandlerFunc {
	return func(c *gin.Context) {
		authHeader := c.GetHeader("Authorization")
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")

		if tokenString == "" {
			tokenString = c.Query("token") // web sockets will pass token as query param
		}

		if tokenString == "" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "No token provided"})
			return
		}

		secret := []byte(os.Getenv("ACCESS_SECRET"))

		token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
			if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
			}
			return secret, nil
		})

		if claims, ok := token.Claims.(jwt.MapClaims); ok && token.Valid {
			c.Set("user_id", claims["id"])
			c.Next()
		} else {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "Invalid token", "details": err.Error()})
		}
	}
}

// to test, paste into the console:

// const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5OTlmOWZhY2Q3YmIwNDNkNDBmYjg3NSIsImVtYWlsIjoicGV0ZXJAZXhhbXBsZS5jb20iLCJpYXQiOjE3NzE2OTg2ODMsImV4cCI6MTc3MTc4NTA4M30.1X9z6wdh_6YdgSeJMYitDNTk-_w9JPnK98zu6s331Kg";
// const socket = new WebSocket(`ws://localhost/ws?token=${token}`);

// socket.onopen = () => {
//     console.log("AUTH SUCCESS: Connected to Go WebSocket Hub!");
//     socket.send(JSON.stringify({ type: "ping", content: "hello from browser" }));
// };

// socket.onmessage = (event) => {
//     console.log("MESSAGE RECEIVED:", event.data);
// };

// socket.onerror = (error) => {
//     console.error("AUTH FAILED: Check Docker logs for middleware errors.");
// };

// socket.onclose = () => {
//     console.log("Connection closed.");
// };
