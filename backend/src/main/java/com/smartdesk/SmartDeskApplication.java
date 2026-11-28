package com.smartdesk;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

import java.util.TimeZone;

@SpringBootApplication
public class SmartDeskApplication {
    public static void main(String[] args) {
        // All timestamps are stored and returned in UTC; the frontend converts them to local time.
        TimeZone.setDefault(TimeZone.getTimeZone("UTC"));
        SpringApplication.run(SmartDeskApplication.class, args);
    }
}
