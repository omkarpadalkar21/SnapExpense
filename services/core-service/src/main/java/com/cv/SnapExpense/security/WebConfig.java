package com.cv.SnapExpense.security;

/**
 * WebConfig intentionally left empty.
 *
 * CORS is fully configured via the CorsConfigurationSource bean in SecurityConfig.
 * Do NOT add a WebMvcConfigurer.addCorsMappings() override here — having two CORS
 * configurations in the same Spring Boot app causes conflicts:
 *   - WebMvcConfigurer runs at the MVC/DispatcherServlet layer
 *   - CorsFilter runs before DispatcherServlet
 * The latter wins for most requests, but the resulting race condition means
 * credentials/preflight headers can be set or stripped depending on request order.
 */
public class WebConfig {
}
