package com.feedback.controller;

import com.feedback.dto.BulkStatusRequest;
import com.feedback.dto.FeedbackDTO;
import com.feedback.entity.Feedback;
import com.feedback.entity.User;
import com.feedback.exception.BadRequestException;
import com.feedback.exception.ForbiddenOperationException;
import com.feedback.service.FeedbackService;
import com.feedback.service.NotificationService;
import com.feedback.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

import java.util.HashMap;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class AdminController {

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private UserService userService;

    @Autowired
    private NotificationService notificationService;

    private String getCurrentAdminCategory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User admin = userService.getUserByEmail(email);
        if (admin.getRole() == null || !"ADMIN".equalsIgnoreCase(admin.getRole())) {
            throw new ForbiddenOperationException("Access denied");
        }
        if (admin.getCategory() == null || admin.getCategory().trim().isEmpty()) {
            throw new ForbiddenOperationException("Admin category is not set");
        }
        return admin.getCategory();
    }

    @GetMapping("/feedback")
    public ResponseEntity<Page<FeedbackDTO>> getAllFeedback(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam() int size,
            @RequestParam(defaultValue = "createdDate") String sortBy) {
        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortBy));
        String adminCategory = getCurrentAdminCategory();
        Page<FeedbackDTO> feedbackPage = feedbackService.getAllFeedbackByCategory(adminCategory, pageable);
        return new ResponseEntity<>(feedbackPage, HttpStatus.OK);
    }

    @GetMapping("/feedback/category/{category}")
    public ResponseEntity<Page<FeedbackDTO>> getFeedbackByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String adminCategory = getCurrentAdminCategory();
        if (category == null || !adminCategory.equalsIgnoreCase(category)) {
            throw new ForbiddenOperationException("You can access feedback only for your category: " + adminCategory);
        }
        Pageable pageable = PageRequest.of(page, size);
        Page<FeedbackDTO> feedbackPage = feedbackService.getFeedbackByCategory(adminCategory, pageable);
        return new ResponseEntity<>(feedbackPage, HttpStatus.OK);
    }

    @GetMapping("/feedback/status/{status}")
    public ResponseEntity<Page<FeedbackDTO>> getFeedbackByStatus(
            @PathVariable String status,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        String adminCategory = getCurrentAdminCategory();
        Pageable pageable = PageRequest.of(page, size);
        Page<FeedbackDTO> feedbackPage = feedbackService.getFeedbackByStatusAndCategory(status, adminCategory, pageable);
        return new ResponseEntity<>(feedbackPage, HttpStatus.OK);
    }

    @GetMapping("/feedback/search")
    public ResponseEntity<Page<FeedbackDTO>> searchFeedback(
            @RequestParam String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        if (title == null || title.trim().isEmpty()) {
            throw new BadRequestException("Title is required");
        }
        String adminCategory = getCurrentAdminCategory();
        Pageable pageable = PageRequest.of(page, size);
        Page<FeedbackDTO> feedbackPage = feedbackService.searchFeedbackByTitleAndCategory(title, adminCategory, pageable);
        return new ResponseEntity<>(feedbackPage, HttpStatus.OK);
    }

    @GetMapping(value = "/feedback/export", produces = "text/csv")
    public ResponseEntity<byte[]> exportFeedbackCsv(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String title) {
        String adminCategory = getCurrentAdminCategory();
        byte[] csvBytes = feedbackService.exportFeedbackCsv(adminCategory, status, title);

        String safeCategory = adminCategory.replaceAll("[^a-zA-Z0-9_-]+", "_");
        String ts = DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss").format(LocalDateTime.now());
        String filename = "feedback_" + safeCategory + "_" + ts + ".csv";

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(new MediaType("text", "csv", StandardCharsets.UTF_8));
        headers.set(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
        return new ResponseEntity<>(csvBytes, headers, HttpStatus.OK);
    }

    @PutMapping("/feedback/{id}/status")
    public ResponseEntity<Feedback> updateFeedbackStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }
        String status = request.get("status");
        String adminCategory = getCurrentAdminCategory();
        Feedback feedback = feedbackService.updateFeedbackStatusForAdminCategory(id, status, adminCategory);
        notificationService.notifyFeedbackOwnerStatusChanged(feedback, status);
        return new ResponseEntity<>(feedback, HttpStatus.OK);
    }

    @PutMapping("/feedback/bulk/status")
    public ResponseEntity<Map<String, Object>> bulkUpdateFeedbackStatus(@RequestBody BulkStatusRequest request) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }
        if (request.getIds() == null || request.getIds().isEmpty()) {
            throw new BadRequestException("Ids are required");
        }

        String adminCategory = getCurrentAdminCategory();
        List<Feedback> updated = feedbackService.bulkUpdateFeedbackStatusForAdminCategory(
                request.getIds(),
                request.getStatus(),
                adminCategory
        );

        // Notify each feedback owner about the status change.
        for (Feedback feedback : updated) {
            notificationService.notifyFeedbackOwnerStatusChanged(feedback, feedback.getStatus());
        }

        Map<String, Object> response = new HashMap<>();
        response.put("updated", updated.size());
        response.put("status", request.getStatus());
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @PutMapping("/feedback/{id}/reply")
    public ResponseEntity<Feedback> addReplyToFeedback(
            @PathVariable Long id,
            @RequestBody Map<String, String> request) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }
        String reply = request.get("reply");
        String adminCategory = getCurrentAdminCategory();
        Feedback feedback = feedbackService.addReplyToFeedbackForAdminCategory(id, reply, adminCategory);
        if (reply != null && !reply.trim().isEmpty()) {
            notificationService.notifyFeedbackOwnerReplied(feedback);
        }
        return new ResponseEntity<>(feedback, HttpStatus.OK);
    }

    @DeleteMapping("/feedback/{id}")
    public ResponseEntity<Map<String, String>> deleteFeedback(@PathVariable Long id) {
        String adminCategory = getCurrentAdminCategory();
        feedbackService.deleteFeedbackForAdminCategory(id, adminCategory);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Feedback deleted successfully");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/dashboard/stats")
    public ResponseEntity<Map<String, Long>> getDashboardStats() {
        String adminCategory = getCurrentAdminCategory();
        Map<String, Long> stats = new HashMap<>();
        stats.put("totalUsers", userService.getTotalUsers());
        stats.put("totalFeedback", feedbackService.getTotalFeedbackByCategory(adminCategory));
        stats.put("pendingFeedback", feedbackService.getPendingFeedbackCountByCategory(adminCategory));
        stats.put("resolvedFeedback", feedbackService.getResolvedFeedbackCountByCategory(adminCategory));
        stats.put("reviewedFeedback", feedbackService.getReviewedFeedbackCountByCategory(adminCategory));
        return new ResponseEntity<>(stats, HttpStatus.OK);
    }
}
