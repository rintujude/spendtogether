package com.familybudget.exception;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.slf4j.MDC;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockHttpServletRequest;

class GlobalExceptionHandlerTest {

    private final GlobalExceptionHandler handler = new GlobalExceptionHandler();

    @AfterEach
    void clearMdc() {
        MDC.clear();
    }

    @Test
    void unexpectedExceptionResponseIncludesRequestIdAndSafeMessage() {
        MDC.put("requestId", "request-123");
        MockHttpServletRequest request = new MockHttpServletRequest("GET", "/api/broken");

        var response = handler.handleUnexpected(new RuntimeException("boom"), request);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.INTERNAL_SERVER_ERROR);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().requestId()).isEqualTo("request-123");
        assertThat(response.getBody().message()).isEqualTo("Something went wrong. Please try again later.");
        assertThat(response.getBody().message()).doesNotContain("boom");
    }
}
