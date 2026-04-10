package com.feedback.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FeedbackDTO {
    private Long id;
    private String title;
    private String description;
    private String category;
    private Integer rating;
    private String status;
    private String username;
    private String reply;
    private LocalDateTime createdDate;
    private LocalDateTime updatedDate;
}
