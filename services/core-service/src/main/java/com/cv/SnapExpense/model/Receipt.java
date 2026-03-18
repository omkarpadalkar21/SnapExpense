package com.cv.SnapExpense.model;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.validator.constraints.URL;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

@Entity
@Table(
        name = "receipts",
        indexes = {
                @Index(name = "idx_receipts_user_date", columnList = "user_id, receipt_date"),
                @Index(name = "idx_receipts_user_cat", columnList = "user_id, category_id")
        }
)
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class Receipt {
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", referencedColumnName = "id")
    private User user;

    @ManyToOne(optional = false, fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", referencedColumnName = "id")
    private Category category;

    @URL
    @Column(length = 500, nullable = false)
    private String imageUrl;

    private String merchantName;

    @Column(precision = 10, scale = 2, nullable = false)
    private BigDecimal totalAmount;

    @Column
    private LocalDate receiptDate;

    @OneToMany(mappedBy = "receipt", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.LAZY)
    private List<ReceiptItem> items = new ArrayList<>();

    @Column(columnDefinition = "TEXT")
    private String ocrText;

    @Column(precision = 4, scale = 3)
    private BigDecimal ocrConfidence;

    @Builder.Default
    private Boolean isVerified = false;

    @Column(length = 500)
    private String notes;

    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;
}
