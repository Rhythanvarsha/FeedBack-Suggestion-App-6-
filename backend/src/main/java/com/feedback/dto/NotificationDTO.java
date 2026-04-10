package com.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class NotificationDTO {
    private Long id;
    private String type;
    private String message;
    private boolean read;
    private LocalDateTime createdAt;
    private Long feedbackId;
}

