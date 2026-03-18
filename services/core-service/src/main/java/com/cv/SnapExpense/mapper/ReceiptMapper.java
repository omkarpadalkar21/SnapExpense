package com.cv.SnapExpense.mapper;

import com.cv.SnapExpense.dto.receipt.CategoryResponse;
import com.cv.SnapExpense.dto.receipt.ReceiptItemResponse;
import com.cv.SnapExpense.dto.receipt.ReceiptResponse;
import com.cv.SnapExpense.model.Category;
import com.cv.SnapExpense.model.Receipt;
import com.cv.SnapExpense.model.ReceiptItem;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;


@Mapper(componentModel = "spring")
public interface ReceiptMapper {

    @Mapping(target = "totalPrice", source = "totalAmount")
    ReceiptItemResponse toReceiptItemResponse(ReceiptItem item);

    CategoryResponse toCategoryResponse(Category category);

    ReceiptResponse toReceiptResponse(Receipt receipt);
}
