package com.feedback.controller;

import com.feedback.dto.FeedbackDTO;
import com.feedback.entity.Feedback;
import com.feedback.entity.User;
import com.feedback.exception.BadRequestException;
import com.feedback.service.FeedbackService;
import com.feedback.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/feedback")
@CrossOrigin(origins = {"http://localhost:3000", "http://localhost:5173"})
public class FeedbackController {

    @Autowired
    private FeedbackService feedbackService;

    @Autowired
    private UserService userService;

    @PostMapping("/submit")
    public ResponseEntity<Feedback> submitFeedback(@RequestBody Map<String, Object> request) {
        if (request == null) {
            throw new BadRequestException("Request body is required");
        }

        String title = request.get("title") instanceof String ? (String) request.get("title") : null;
        String description = request.get("description") instanceof String ? (String) request.get("description") : null;
        String category = request.get("category") instanceof String ? (String) request.get("category") : null;
        String username = request.get("username") instanceof String ? (String) request.get("username") : null;

        Object ratingObj = request.get("rating");
        Object userIdObj = request.get("userId");

        if (!(ratingObj instanceof Number)) {
            throw new BadRequestException("Rating is required");
        }
        if (!(userIdObj instanceof Number)) {
            throw new BadRequestException("UserId is required");
        }

        Integer rating = ((Number) ratingObj).intValue();
        Long userId = ((Number) userIdObj).longValue();

        Feedback feedback = feedbackService.submitFeedback(title, description, category, rating, username, userId);
        return new ResponseEntity<>(feedback, HttpStatus.CREATED);
    }

    @PutMapping("/{id}/edit")
    public ResponseEntity<Feedback> editFeedback(@PathVariable Long id, @RequestBody Map<String, Object> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();

        if (request == null) {
            throw new BadRequestException("Request body is required");
        }

        String title = (String) request.get("title");
        String description = (String) request.get("description");
        String category = (String) request.get("category");
        Integer rating = null;
        if (request.get("rating") != null) {
            if (!(request.get("rating") instanceof Number)) {
                throw new BadRequestException("Rating must be a number");
            }
            rating = ((Number) request.get("rating")).intValue();
        }

        Feedback feedback = feedbackService.updateMyFeedback(email, id, title, description, category, rating);
        return new ResponseEntity<>(feedback, HttpStatus.OK);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Map<String, String>> deleteFeedback(@PathVariable Long id) {
        feedbackService.deleteFeedback(id);
        Map<String, String> response = new HashMap<>();
        response.put("message", "Feedback deleted successfully");
        return new ResponseEntity<>(response, HttpStatus.OK);
    }

    @GetMapping("/my-feedback")
    public ResponseEntity<Page<FeedbackDTO>> getMyFeedback(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortBy));
        Page<FeedbackDTO> feedbackPage = feedbackService.getFeedbackByUsername(username, pageable);
        return new ResponseEntity<>(feedbackPage, HttpStatus.OK);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Feedback> getFeedbackById(@PathVariable Long id) {
        Feedback feedback = feedbackService.getFeedbackById(id);
        return new ResponseEntity<>(feedback, HttpStatus.OK);
    }

    @GetMapping("/category/{category}")
    public ResponseEntity<Page<FeedbackDTO>> getFeedbackByCategory(
            @PathVariable String category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FeedbackDTO> feedbackPage = feedbackService.getFeedbackByCategory(category, pageable);
        return new ResponseEntity<>(feedbackPage, HttpStatus.OK);
    }

    @GetMapping("/search")
    public ResponseEntity<Page<FeedbackDTO>> searchFeedback(
            @RequestParam String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size) {
        Pageable pageable = PageRequest.of(page, size);
        Page<FeedbackDTO> feedbackPage = feedbackService.searchFeedbackByTitle(title, pageable);
        return new ResponseEntity<>(feedbackPage, HttpStatus.OK);
    }

    @GetMapping("/my-feedback/search")
    public ResponseEntity<Page<FeedbackDTO>> searchMyFeedback(
            @RequestParam String title,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "createdDate") String sortBy) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();

        Pageable pageable = PageRequest.of(page, size, Sort.by(Sort.Direction.DESC, sortBy));
        Page<FeedbackDTO> feedbackPage = feedbackService.searchMyFeedbackByTitle(username, title, pageable);
        return new ResponseEntity<>(feedbackPage, HttpStatus.OK);
    }

    @GetMapping("/user/stats")
    public ResponseEntity<Map<String, Long>> getUserDashboardStats() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String email = authentication.getName();
        User user = userService.getUserByEmail(email);
        Long userId = user.getId();

        Map<String, Long> stats = new HashMap<>();
        stats.put("myTotalFeedback", feedbackService.getUserTotalFeedback(userId));
        stats.put("myPendingFeedback", feedbackService.getUserPendingFeedbackCount(userId));
        stats.put("myResolvedFeedback", feedbackService.getUserResolvedFeedbackCount(userId));
        stats.put("myReviewedFeedback", feedbackService.getUserReviewedFeedbackCount(userId));
        return new ResponseEntity<>(stats, HttpStatus.OK);
    }
}
