"use client";

import { Plus, Trash2 } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatCurrency } from "@/lib/formatCurrency";
import type { LineItem } from "@/lib/types";

interface LineItemsAccordionProps {
  items: LineItem[];
  editable?: boolean;
}

export function LineItemsAccordion({ items, editable = false }: LineItemsAccordionProps) {
  return (
    <Accordion type="single" collapsible>
      <AccordionItem value="items" className="border-none">
        <AccordionTrigger className="text-sm font-semibold px-0 hover:no-underline">
          Items Extracted ({items.length})
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2">
            {/* Header */}
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground font-medium px-1">
              <div className="col-span-5">Item</div>
              <div className="col-span-2 text-center">Qty</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-3 text-right">Total</div>
            </div>

            {/* Items */}
            {items.map((item) => (
              <div
                key={item.id}
                className="grid grid-cols-12 gap-2 items-center bg-gray-50 rounded-xl px-3 py-2.5"
              >
                {editable ? (
                  <>
                    <div className="col-span-5">
                      <Input defaultValue={item.name} className="h-8 text-xs" />
                    </div>
                    <div className="col-span-2">
                      <Input defaultValue={item.quantity} type="number" className="h-8 text-xs text-center" />
                    </div>
                    <div className="col-span-2">
                      <Input defaultValue={item.unitPrice} type="number" className="h-8 text-xs text-right" />
                    </div>
                    <div className="col-span-2 text-right text-xs font-medium">
                      {formatCurrency(item.total)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-danger">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-5 text-xs font-medium truncate">{item.name}</div>
                    <div className="col-span-2 text-xs text-center text-muted-foreground">{item.quantity}</div>
                    <div className="col-span-2 text-xs text-right text-muted-foreground">
                      {formatCurrency(item.unitPrice)}
                    </div>
                    <div className="col-span-3 text-xs text-right font-medium">
                      {formatCurrency(item.total)}
                    </div>
                  </>
                )}
              </div>
            ))}

            {editable && (
              <Button variant="ghost" size="sm" className="w-full text-primary hover:text-primary mt-2">
                <Plus className="h-4 w-4 mr-1" />
                Add Item
              </Button>
            )}
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
