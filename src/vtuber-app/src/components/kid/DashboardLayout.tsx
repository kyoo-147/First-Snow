import { Box, Flex, Text, Heading, VStack, HStack, Input } from "@chakra-ui/react";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Button } from "../ui/button";
import {
  FiHome,
  FiMessageSquare,
  FiBookOpen,
  FiActivity,
  FiUser,
  FiCalendar,
  FiSearch,
  FiBell,
  FiPlus,
  FiEdit3,
  FiChevronDown,
  FiMail,
  FiFileText,
  FiVolume2,
  FiGrid,
  FiBriefcase
} from "react-icons/fi";

interface KidProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  status: "Active Session" | "Resting" | "Ready";
  color: string;
  points?: number;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
  onChangeProfile: () => void;
  onLogout: () => void;
}

export default function DashboardLayout({
  children,
  onChangeProfile,
  onLogout
}: DashboardLayoutProps): React.JSX.Element {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeProfile, setActiveProfile] = useState<KidProfile | null>(null);

  useEffect(() => {
    const profileStr = localStorage.getItem("kid_active_profile");
    if (profileStr) {
      setActiveProfile(JSON.parse(profileStr));
    }
  }, [location.pathname]);

  const username = activeProfile ? activeProfile.name : "Bé Leo";
  const userAvatar = activeProfile ? activeProfile.avatar : "./images/leo_avatar.png";
  const currentPath = location.pathname;

  const handleMenuClick = (path: string) => {
    navigate(path);
  };

  const isActive = (path: string) => currentPath === path;

  return (
    <Flex width="100vw" height="100vh" bg="#F8FAFC" overflow="hidden" fontFamily="'Inter', system-ui, sans-serif">
      
      {/* LEFT SIDEBAR */}
      <Flex
        width="240px"
        height="100%"
        bg="#FFFFFF"
        borderRight="1px solid"
        borderColor="#E2E8F0"
        flexDirection="column"
        justifyContent="space-between"
        p={5}
        flexShrink={0}
      >
        <VStack spaceY={5} alignItems="stretch" width="100%">
          
          {/* Logo & Collapse Header */}
          <HStack justifyContent="space-between" alignItems="center" px={1}>
            <HStack spaceX={2.5}>
              <Box
                w="32px"
                h="32px"
                borderRadius="lg"
                bg="#6366F1"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <span style={{ fontSize: "16px", color: "white", fontWeight: "bold" }}>📚</span>
              </Box>
              <Text fontSize="md" fontWeight="bold" color="#0F172A" letterSpacing="-0.01em">
                Eduler
              </Text>
            </HStack>
            <Box cursor="pointer" color="#94A3B8" _hover={{ color: "#0F172A" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M9 3v18" />
                <path d="m16 15-3-3 3-3" />
              </svg>
            </Box>
          </HStack>

          {/* Search Input Box */}
          <Box position="relative" width="100%">
            <Input
              placeholder="Tìm kiếm nhanh..."
              size="sm"
              borderRadius="xl"
              borderColor="#E2E8F0"
              bg="#FFFFFF"
              pl="32px"
              pr="32px"
              h="36px"
              fontSize="xs"
              _focus={{ borderColor: "#6366F1", boxShadow: "none" }}
            />
            <Box position="absolute" left="10px" top="50%" transform="translateY(-50%)" color="#94A3B8">
              <FiSearch size={13} />
            </Box>
            <Box position="absolute" right="10px" top="50%" transform="translateY(-50%)" color="#94A3B8" cursor="pointer">
              <FiEdit3 size={13} />
            </Box>
          </Box>

          {/* Core Menu List */}
          <VStack spaceY={1} alignItems="stretch" width="100%">
            
            {/* Dashboard */}
            <Box
              onClick={() => handleMenuClick("/dashboard")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="38px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/dashboard") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiHome size={14} color={isActive("/dashboard") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/dashboard") ? "bold" : "semibold"} color={isActive("/dashboard") ? "#0F172A" : "#64748B"}>
                  Dashboard
                </Text>
              </HStack>
            </Box>

            {/* Documents Menu Item */}
            <Box
              onClick={() => handleMenuClick("/documents")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="38px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/documents") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiFileText size={14} color={isActive("/documents") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/documents") ? "bold" : "semibold"} color={isActive("/documents") ? "#0F172A" : "#64748B"}>
                  Documents
                </Text>
              </HStack>
            </Box>
          </VStack>

          {/* Section: Study Tools */}
          <VStack spaceY={1} alignItems="stretch" width="100%">
            <HStack justifyContent="space-between" px={3.5} py={1}>
              <Text fontSize="10px" fontWeight="extrabold" color="#94A3B8" textTransform="uppercase" letterSpacing="0.05em">
                Study Tools
              </Text>
              <Box color="#94A3B8" cursor="pointer"><FiPlus size={10} /></Box>
            </HStack>

            {/* AI Writer */}
            <Box
              onClick={() => handleMenuClick("/ai-writer")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/ai-writer") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiEdit3 size={13} color={isActive("/ai-writer") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/ai-writer") ? "bold" : "semibold"} color={isActive("/ai-writer") ? "#0F172A" : "#64748B"}>
                  AI Writer
                </Text>
              </HStack>
            </Box>

            {/* AI Teachers */}
            <Box
              onClick={() => handleMenuClick("/ai-teachers")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/ai-teachers") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiBookOpen size={13} color={isActive("/ai-teachers") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/ai-teachers") ? "bold" : "semibold"} color={isActive("/ai-teachers") ? "#0F172A" : "#64748B"}>
                  AI Teachers
                </Text>
              </HStack>
            </Box>

            {/* Assistants */}
            <Box
              onClick={() => handleMenuClick("/assistants")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/assistants") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiUser size={13} color={isActive("/assistants") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/assistants") ? "bold" : "semibold"} color={isActive("/assistants") ? "#0F172A" : "#64748B"}>
                  Assistants
                </Text>
              </HStack>
            </Box>

            {/* Analytics */}
            <Box
              onClick={() => handleMenuClick("/analysis")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/analysis") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiActivity size={13} color={isActive("/analysis") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/analysis") ? "bold" : "semibold"} color={isActive("/analysis") ? "#0F172A" : "#64748B"}>
                  Analytics
                </Text>
              </HStack>
            </Box>

            {/* Courses */}
            <Box
              onClick={() => handleMenuClick("/course")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/course") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiGrid size={13} color={isActive("/course") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/course") ? "bold" : "semibold"} color={isActive("/course") ? "#0F172A" : "#64748B"}>
                  Courses
                </Text>
              </HStack>
            </Box>

            {/* Events */}
            <Box
              onClick={() => handleMenuClick("/events")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/events") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiCalendar size={13} color={isActive("/events") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/events") ? "bold" : "semibold"} color={isActive("/events") ? "#0F172A" : "#64748B"}>
                  Events
                </Text>
              </HStack>
            </Box>
          </VStack>

          {/* Section: AI Voice Tools */}
          <VStack spaceY={1} alignItems="stretch" width="100%">
            <HStack justifyContent="space-between" px={3.5} py={1}>
              <Text fontSize="10px" fontWeight="extrabold" color="#94A3B8" textTransform="uppercase" letterSpacing="0.05em">
                AI Voice Tools
              </Text>
              <Box color="#94A3B8" cursor="pointer"><FiPlus size={10} /></Box>
            </HStack>

            {/* Speech to Text */}
            <Box
              onClick={() => handleMenuClick("/speech-to-text")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/speech-to-text") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiVolume2 size={13} color={isActive("/speech-to-text") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/speech-to-text") ? "bold" : "semibold"} color={isActive("/speech-to-text") ? "#0F172A" : "#64748B"}>
                  Speech to Text
                </Text>
              </HStack>
            </Box>

            {/* Voiceover */}
            <Box
              onClick={() => handleMenuClick("/voiceover")}
              cursor="pointer"
              borderRadius="xl"
              position="relative"
              h="36px"
              display="flex"
              alignItems="center"
              px={3.5}
              _hover={{ bg: "#F8FAFC" }}
            >
              {isActive("/voiceover") && (
                <Box
                  position="absolute"
                  inset={0}
                  borderRadius="xl"
                  bgGradient="to-r(from rgba(224, 242, 254, 0.8), to rgba(253, 244, 245, 0.8))"
                  zIndex={0}
                />
              )}
              <HStack spaceX={3} zIndex={1}>
                <FiVolume2 size={13} color={isActive("/voiceover") ? "#6366F1" : "#64748B"} />
                <Text fontSize="xs" fontWeight={isActive("/voiceover") ? "bold" : "semibold"} color={isActive("/voiceover") ? "#0F172A" : "#64748B"}>
                  Voiceover
                </Text>
              </HStack>
            </Box>
          </VStack>
        </VStack>

        {/* BOTTOM METRIC CARD */}
        <VStack spaceY={4} alignItems="stretch" width="100%">
          
          {/* Progress Widget Card */}
          <Box p={4} bg="#F5F3FF" borderRadius="2xl" border="1px solid" borderColor="#DDD6FE">
            <VStack spaceY={2.5} alignItems="stretch">
              <HStack justifyContent="space-between" fontSize="11px" fontWeight="bold" color="#6D28D9">
                <Text>Cấp độ bé</Text>
                <Text>Cấp 3</Text>
              </HStack>
              <HStack justifyContent="space-between" fontSize="11px" fontWeight="bold" color="#6D28D9" mt={-1}>
                <Text>Điểm tích lũy</Text>
                <Text>{activeProfile?.points || 0} XP</Text>
              </HStack>

              {/* Progress bar */}
              <Box w="100%" bg="#E9D5FF" h="6px" borderRadius="full" overflow="hidden" mt={1}>
                <Box w="60%" bg="#7C3AED" h="100%" borderRadius="full" />
              </Box>

              <Button
                onClick={() => navigate("/course")}
                size="sm"
                bg="#FFFFFF"
                color="#7C3AED"
                border="1px solid"
                borderColor="#C084FC"
                borderRadius="full"
                h="32px"
                fontWeight="bold"
                fontSize="xs"
                _hover={{ bg: "#F3E8FF" }}
                mt={1}
              >
                Đổi quà thưởng
              </Button>
            </VStack>
          </Box>

          {/* Help & Support */}
          <VStack spaceY={1.5} px={1}>
            <HStack spaceX={3} py={1} cursor="pointer" color="#64748B" _hover={{ color: "#0F172A" }} onClick={() => navigate("/documents")}>
              <FiBriefcase size={13} />
              <Text fontSize="xs" fontWeight="semibold">Hướng dẫn phụ huynh</Text>
            </HStack>
            
            <HStack spaceX={3} py={1} cursor="pointer" color="#64748B" _hover={{ color: "#0F172A" }}>
              <FiMessageSquare size={13} />
              <Text fontSize="xs" fontWeight="semibold">Hỗ trợ kỹ thuật</Text>
            </HStack>

            <Box borderTop="1px solid" borderColor="#E2E8F0" my={1} />

            {/* Profile actions switcher */}
            <HStack justifyContent="space-between">
              <Button
                onClick={onChangeProfile}
                variant="ghost"
                size="xs"
                color="#64748B"
                fontSize="10px"
                h="28px"
                p={0}
                _hover={{ bg: "transparent", color: "#0F172A" }}
              >
                Đổi hồ sơ bé
              </Button>
              <Button
                onClick={onLogout}
                variant="ghost"
                size="xs"
                color="#E11D48"
                fontSize="10px"
                h="28px"
                p={0}
                _hover={{ bg: "transparent", color: "#9F1239" }}
              >
                Đăng xuất
              </Button>
            </HStack>
          </VStack>
        </VStack>
      </Flex>

      {/* MAIN CONTAINER */}
      <Flex flexGrow={1} flexDirection="column" overflow="hidden">
        
        {/* TOP BAR / HEADER */}
        <Flex
          h="64px"
          bg="#FFFFFF"
          borderBottom="1px solid"
          borderColor="#E2E8F0"
          px={8}
          alignItems="center"
          justifyContent="space-between"
          flexShrink={0}
        >
          {/* Dynamic Page Title based on route */}
          <Heading size="lg" color="#0F172A" fontWeight="bold" letterSpacing="-0.02em" textTransform="capitalize">
            {currentPath.replace("/", "") || "Dashboard"}
          </Heading>

          {/* Search bar inside header */}
          <Box position="relative" width="280px">
            <Input
              placeholder="Search anything"
              size="sm"
              borderRadius="xl"
              borderColor="#E2E8F0"
              bg="#F1F5F9"
              pl="34px"
              pr="45px"
              h="36px"
              fontSize="xs"
              border="none"
              _focus={{ bg: "#E2E8F0", boxShadow: "none" }}
            />
            <Box position="absolute" left="12px" top="50%" transform="translateY(-50%)" color="#94A3B8">
              <FiSearch size={13} />
            </Box>
            <HStack
              position="absolute"
              right="10px"
              top="50%"
              transform="translateY(-50%)"
              spaceX={0.5}
              px={1.5}
              py={0.5}
              bg="#FFFFFF"
              borderRadius="md"
              border="1px solid"
              borderColor="#E2E8F0"
              fontSize="9px"
              fontWeight="bold"
              color="#94A3B8"
            >
              <Text>⌘</Text>
              <Text>F</Text>
            </HStack>
          </Box>

          {/* Header Action Menu */}
          <HStack spaceX={4.5}>
            <Box
              cursor="pointer"
              w="36px"
              h="36px"
              borderRadius="full"
              border="1px solid"
              borderColor="#E2E8F0"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="#64748B"
              _hover={{ bg: "#F1F5F9", color: "#0F172A" }}
            >
              <FiMail size={15} />
            </Box>

            <Box
              cursor="pointer"
              w="36px"
              h="36px"
              borderRadius="full"
              border="1px solid"
              borderColor="#E2E8F0"
              display="flex"
              alignItems="center"
              justifyContent="center"
              color="#64748B"
              position="relative"
              _hover={{ bg: "#F1F5F9", color: "#0F172A" }}
            >
              <FiBell size={15} />
              <Box position="absolute" top="10px" right="10px" w="6px" h="6px" borderRadius="full" bg="#E11D48" />
            </Box>

            <Box borderLeft="1px solid" borderColor="#E2E8F0" h="24px" />

            {/* Profile Dropdown */}
            <HStack spaceX={2.5} cursor="pointer">
              <Box
                w="36px"
                h="36px"
                borderRadius="full"
                overflow="hidden"
                border="1.5px solid"
                borderColor="#E2E8F0"
              >
                <img src={userAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </Box>
              <VStack spaceY={0} alignItems="flex-start" display={{ base: "none", md: "flex" }}>
                <Text fontSize="xs" fontWeight="bold" color="#0F172A">
                  {username}
                </Text>
                <Text fontSize="9px" color="#94A3B8" fontWeight="semibold" mt={-0.5}>
                  Student
                </Text>
              </VStack>
              <FiChevronDown size={12} color="#94A3B8" />
            </HStack>
          </HStack>
        </Flex>

        {/* WORKSPACE CONTENT SCROLL */}
        <Box flexGrow={1} overflowY="auto" p={8} bg="#F8FAFC">
          {children}
        </Box>

      </Flex>

    </Flex>
  );
}
