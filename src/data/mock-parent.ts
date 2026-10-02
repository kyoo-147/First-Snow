import type { Parent } from "@/types/snow";
import { mockChildren } from "./mock-children";

export const mockParent: Parent = {
  id: "parent-1",
  name: "Sarah Nguyen",
  email: "sarah@example.com",
  children: mockChildren,
};
