import { useState, useEffect } from "react";
import { Box, Flex, Text, Heading, SimpleGrid, VStack, HStack, Input } from "@chakra-ui/react";
import { Button } from "../ui/button";
import { Field } from "../ui/field";
import { toaster } from "../ui/toaster";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlus, FiArrowRight, FiArrowLeft, FiLogOut } from "react-icons/fi";

const MotionBox = motion(Box);
// const MotionFlex = motion(Flex);

interface KidProfile {
  id: string;
  name: string;
  age: number;
  avatar: string;
  status: "Active Session" | "Resting" | "Ready";
  color: string;
}

interface ChildProfilesScreenProps {
  onSelectProfile: (profile: KidProfile) => void;
  onLogout: () => void;
  userEmail: string;
}

const DEFAULT_PROFILES: KidProfile[] = [
  {
    id: "leo",
    name: "Bé Leo",
    age: 5,
    avatar: "./images/leo_avatar.png",
    status: "Active Session",
    color: "#0E7490", // Teal/Cyan
  },
  {
    id: "nana",
    name: "Bé Nana",
    age: 4,
    avatar: "./images/nana_avatar.png",
    status: "Resting",
    color: "#7C3AED", // Violet/Purple (as requested in mockup)
  }
];

export default function ChildProfilesScreen({
  onSelectProfile,
  onLogout,
  userEmail,
}: ChildProfilesScreenProps): React.JSX.Element {
  const [profiles, setProfiles] = useState<KidProfile[]>([]);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [newName, setNewName] = useState("");
  const [newAge, setNewAge] = useState("");
  const [selectedAvatar, setSelectedAvatar] = useState("./images/leo_avatar.png");

  // Initialize profiles in memory
  useEffect(() => {
    try {
      localStorage.removeItem("kid_active_profile");
      localStorage.removeItem("kid_profiles");
    } catch {
      // ignore
    }
    setProfiles(DEFAULT_PROFILES);
  }, []);

  const handleSelectProfile = (profile: KidProfile) => {
    // Toast notification
    toaster.create({
      title: `Đã kết nối với ${profile.name}`,
      description: `Bắt đầu hành trình cùng ${profile.name} nhé!`,
      type: "success",
      duration: 3000,
    });

    onSelectProfile(profile);
  };

  const handleAddProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newAge.trim()) {
      toaster.create({
        title: "Vui lòng nhập đầy đủ thông tin",
        type: "error",
        duration: 3000,
      });
      return;
    }

    const ageNum = parseInt(newAge, 10);
    if (isNaN(ageNum) || ageNum <= 0) {
      toaster.create({
        title: "Tuổi của bé không hợp lệ",
        type: "error",
        duration: 3000,
      });
      return;
    }

    const newProfile: KidProfile = {
      id: `profile_${Date.now()}`,
      name: newName.trim(),
      age: ageNum,
      avatar: selectedAvatar,
      status: "Ready",
      color: profiles.length % 2 === 0 ? "#0D9488" : "#D97706", // Alternating colors
    };

    const updated = [...profiles, newProfile];
    setProfiles(updated);

    // Reset state
    setNewName("");
    setNewAge("");
    setIsAddingNew(false);

    toaster.create({
      title: `Đã thêm hồ sơ cho ${newProfile.name}`,
      type: "success",
      duration: 3000,
    });
  };

  const avatarOptions = [
    { src: "./images/leo_avatar.png", label: "Leo" },
    { src: "./images/nana_avatar.png", label: "Nana" },
    { src: "./images/momo_mascot.png", label: "Momo" },
  ];

  return (
    <Flex
      width="100vw"
      height="100vh"
      bgGradient="radial(circle at center, #F3F8FC 0%, #E2EFF9 100%)"
      flexDirection="column"
      overflow="auto"
      p={{ base: 6, md: 10 }}
      position="relative"
    >
      {/* Header bar */}
      <Flex zIndex={1} alignItems="center" width="100%" mb={{ base: 8, md: 12 }}>
        <HStack spaceX={3} alignItems="center">
          <Box
            width="40px"
            height="40px"
            borderRadius="xl"
            bg="white"
            display="flex"
            alignItems="center"
            justifyContent="center"
            boxShadow="0 4px 6px -1px rgba(0,0,0,0.05)"
            border="1px solid"
            borderColor="rgba(14, 165, 233, 0.15)"
          >
            <img src="./images/momo_mascot.png" alt="Momo Logo" style={{ width: "26px", height: "auto" }} />
          </Box>
          <VStack spaceY={0} alignItems="flex-start">
            <Heading size="md" color="#0F172A" fontWeight="bold">
              KindredAI
            </Heading>
            <Text color="#64748B" fontSize="10px" textTransform="uppercase" letterSpacing="wider">
              Secure & Private
            </Text>
          </VStack>
        </HStack>

        <Box flexGrow={1} />

        <HStack spaceX={4}>
          <Text color="#64748B" fontSize="sm" display={{ base: "none", sm: "block" }}>
            Tài khoản: {userEmail}
          </Text>
          <Button
            onClick={onLogout}
            variant="ghost"
            color="#64748B"
            borderRadius="xl"
            _hover={{ bg: "white", color: "#0F172A" }}
            size="sm"
          >
            <FiLogOut style={{ marginRight: "6px" }} /> Đăng xuất
          </Button>
        </HStack>
      </Flex>

      {/* Main Container */}
      <Flex flexGrow={1} zIndex={1} flexDirection="column" alignItems="center" justifyContent="center" width="100%">
        <AnimatePresence mode="wait">
          {!isAddingNew ? (
            <MotionBox
              key="profile-list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              width="100%"
              maxW="1000px"
              textAlign="center"
            >
              <VStack spaceY={3} mb={{ base: 10, md: 14 }}>
                <Heading size="3xl" color="#0F172A" fontWeight="bold" letterSpacing="tight">
                  Chào mừng ba mẹ quay lại!
                </Heading>
                <Text color="#475569" fontSize="md" maxW="550px">
                  Chọn hồ sơ của bé để bắt đầu hành trình tương tác cảm xúc hàng ngày hoặc quản lý không gian của riêng bé.
                </Text>
              </VStack>

              <SimpleGrid
                columns={{ base: 1, sm: 2, md: 3 }}
                spaceX={{ base: 0, sm: 6 }}
                spaceY={{ base: 6, sm: 0 }}
                width="100%"
              >
                {profiles.map((profile, idx) => (
                  <MotionBox
                    key={profile.id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: idx * 0.1 }}
                    whileHover={{ y: -8 }}
                    bg="white"
                    borderRadius="3xl"
                    p={8}
                    boxShadow="0 10px 30px -10px rgba(0, 0, 0, 0.04), 0 1px 3px rgba(0,0,0,0.01)"
                    border="2px solid"
                    borderColor="rgba(226, 232, 240, 0.6)"
                    display="flex"
                    flexDirection="column"
                    alignItems="center"
                    position="relative"
                    overflow="hidden"
                  >
                    {/* Status Badge */}
                    <Box
                      position="absolute"
                      top="16px"
                      right="16px"
                      bg={profile.status === "Active Session" ? "rgba(16, 185, 129, 0.08)" : "rgba(100, 116, 139, 0.08)"}
                      color={profile.status === "Active Session" ? "#059669" : "#64748B"}
                      borderRadius="full"
                      px={3}
                      py={1}
                      fontSize="xs"
                      fontWeight="semibold"
                      display="flex"
                      alignItems="center"
                      gap="1.5"
                    >
                      <Box
                        w="6px"
                        h="6px"
                        borderRadius="full"
                        bg={profile.status === "Active Session" ? "#10B981" : "#64748B"}
                      />
                      {profile.status === "Active Session" ? "Active Session" : profile.status === "Resting" ? "Resting" : "Sẵn sàng"}
                    </Box>

                    {/* Avatar Circle Container */}
                    <Box
                      w="110px"
                      h="110px"
                      borderRadius="full"
                      overflow="hidden"
                      border="3px solid"
                      borderColor={profile.color}
                      p="4px"
                      bg="white"
                      mt={6}
                      mb={4}
                      boxShadow="0 8px 16px -4px rgba(0,0,0,0.05)"
                    >
                      <Box borderRadius="full" overflow="hidden" w="100%" h="100%">
                        <img
                          src={profile.avatar}
                          alt={profile.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                      </Box>
                    </Box>

                    <Heading size="xl" color="#0F172A" fontWeight="bold">
                      {profile.name}
                    </Heading>
                    <Text color="#64748B" fontSize="xs" mb={8}>
                      Độ tuổi: {profile.age} tuổi
                    </Text>

                    <Button
                      onClick={() => handleSelectProfile(profile)}
                      width="100%"
                      size="lg"
                      borderRadius="2xl"
                      bg={profile.color}
                      color="white"
                      fontWeight="bold"
                      _hover={{ filter: "brightness(0.92)" }}
                      _active={{ transform: "scale(0.98)" }}
                    >
                      Chọn Hồ Sơ <FiArrowRight style={{ marginLeft: "8px" }} />
                    </Button>
                  </MotionBox>
                ))}

                {/* Add New Card */}
                <MotionBox
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: profiles.length * 0.1 }}
                  whileHover={{ y: -8 }}
                  onClick={() => setIsAddingNew(true)}
                  bg="rgba(255, 255, 255, 0.45)"
                  backdropFilter="blur(8px)"
                  borderRadius="3xl"
                  p={8}
                  border="2px dashed"
                  borderColor="#CBD5E1"
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  cursor="pointer"
                  minHeight="320px"
                  _hover={{ borderColor: "#0EA5E9", bg: "white" }}
                  css={{ transition: "all 0.3s ease" }}
                >
                  <Flex
                    width="64px"
                    height="64px"
                    borderRadius="full"
                    bg="rgba(14, 165, 233, 0.08)"
                    alignItems="center"
                    justifyContent="center"
                    mb={4}
                    color="#0EA5E9"
                    _groupHover={{ bg: "#0EA5E9", color: "white" }}
                  >
                    <FiPlus size={28} />
                  </Flex>
                  <Heading size="md" color="#1E293B" fontWeight="bold">
                    Thêm bé mới
                  </Heading>
                  <Text color="#64748B" fontSize="xs" mt={2} textAlign="center" maxW="200px">
                    Tạo hồ sơ học tập cảm xúc mới cho bé nhà bạn.
                  </Text>
                </MotionBox>
              </SimpleGrid>
            </MotionBox>
          ) : (
            <MotionBox
              key="add-profile-form"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3 }}
              width="100%"
              maxW="520px"
              bg="white"
              borderRadius="3xl"
              p={{ base: 8, md: 10 }}
              boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.08)"
              border="1px solid"
              borderColor="rgba(226, 232, 240, 0.8)"
            >
              <HStack spaceX={2} mb={6} cursor="pointer" onClick={() => setIsAddingNew(false)} color="#64748B" _hover={{ color: "#0F172A" }}>
                <FiArrowLeft />
                <Text fontSize="sm" fontWeight="semibold">Quay lại danh sách</Text>
              </HStack>

              <Heading size="2xl" color="#0F172A" fontWeight="bold" mb={2}>
                Tạo hồ sơ cho bé
              </Heading>
              <Text color="#64748B" fontSize="sm" mb={8}>
                Nhập các thông tin để cá nhân hóa người bạn Momo phù hợp nhất với bé.
              </Text>

              <form onSubmit={handleAddProfile}>
                <VStack spaceY={5} alignItems="stretch" width="100%">
                  <Field label="Tên của bé (Biệt danh)" required>
                    <Input
                      placeholder="VD: Bé Leo, Tin Tin, Su Su"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      borderRadius="xl"
                      size="lg"
                      border="1.5px solid"
                      borderColor="#E2E8F0"
                      _focus={{ borderColor: "#0EA5E9", boxShadow: "0 0 0 1px #0EA5E9" }}
                    />
                  </Field>

                  <Field label="Tuổi của bé" required>
                    <Input
                      type="number"
                      placeholder="VD: 5"
                      value={newAge}
                      onChange={(e) => setNewAge(e.target.value)}
                      borderRadius="xl"
                      size="lg"
                      border="1.5px solid"
                      borderColor="#E2E8F0"
                      _focus={{ borderColor: "#0EA5E9", boxShadow: "0 0 0 1px #0EA5E9" }}
                    />
                  </Field>

                  <VStack align="stretch" spaceY={2.5}>
                    <Text fontSize="sm" fontWeight="semibold" color="#1E293B">Chọn ảnh đại diện</Text>
                    <HStack spaceX={4} justifyContent="flex-start">
                      {avatarOptions.map((avatar, index) => (
                        <Box
                          key={index}
                          w="76px"
                          h="76px"
                          borderRadius="full"
                          overflow="hidden"
                          cursor="pointer"
                          border="3px solid"
                          borderColor={selectedAvatar === avatar.src ? "#0EA5E9" : "transparent"}
                          p="2px"
                          bg="white"
                          boxShadow="0 4px 6px -1px rgba(0,0,0,0.05)"
                          onClick={() => setSelectedAvatar(avatar.src)}
                          transition="all 0.2s"
                        >
                          <Box borderRadius="full" overflow="hidden" w="100%" h="100%">
                            <img
                              src={avatar.src}
                              alt={avatar.label}
                              style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                          </Box>
                        </Box>
                      ))}
                    </HStack>
                  </VStack>

                  <Button
                    type="submit"
                    bg="#0EA5E9"
                    color="white"
                    size="lg"
                    borderRadius="2xl"
                    fontWeight="bold"
                    width="100%"
                    mt={6}
                    _hover={{ bg: "#0284C7" }}
                  >
                    Tạo Hồ Sơ Mới
                  </Button>
                </VStack>
              </form>
            </MotionBox>
          )}
        </AnimatePresence>
      </Flex>

      {/* Footer bar */}
      <Box zIndex={1} textAlign="center" mt={12} color="#94A3B8" fontSize="xs">
        © 2026 KindredAI Platform. Thiết kế hướng tới sự an toàn và phát triển cảm xúc của trẻ.
      </Box>
    </Flex>
  );
}
