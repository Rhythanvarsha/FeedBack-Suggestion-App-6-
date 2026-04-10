package com.feedback.controller;

import com.feedback.dto.NotificationDTO;
import com.feedback.service.NotificationService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class NotificationController {

    @Autowired
    private NotificationService notificationService;

    @GetMapping
    public ResponseEntity<List<NotificationDTO>> getMyNotifications(
            @RequestParam(defaultValue = "20") int limit) {
        return new ResponseEntity<>(notificationService.getMyNotifications(limit), HttpStatus.OK);
    }

    @GetMapping("/unread-count")
    public ResponseEntity<Map<String, Long>> getMyUnreadCount() {
        Map<String, Long> response = new HashMap<>();
        response.put("unreadCount", notificationService.getMyUnreadCount());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/{id}/read")
    public ResponseEntity<Map<String, String>> markRead(@PathVariable Long id) {
        notificationService.markRead(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Notification marked as read");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/read-all")
    public ResponseEntity<Map<String, Object>> markAllRead() {
        int updated = notificationService.markAllRead();
        Map<String, Object> response = new HashMap<>();
        response.put("message", "All notifications marked as read");
        response.put("updated", updated);
        return new ResponseEntity<>(response, HttpStatus.OK);
    }
}
