package com.cv.SnapExpense;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class SnapExpenseApplication {

	public static void main(String[] args) {
		SpringApplication.run(SnapExpenseApplication.class, args);
	}

}
