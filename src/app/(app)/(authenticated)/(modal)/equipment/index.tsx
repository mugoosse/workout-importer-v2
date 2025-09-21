import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "convex/react";
import { Link, router } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Page = () => {
  const [searchText, setSearchText] = useState("");

  // Get all equipment
  const equipment = useQuery(api.exercises.getAllEquipment, {});

  // Filter equipment based on search
  const filteredEquipment = useMemo(() => {
    if (!equipment) return [];

    if (!searchText.trim()) return equipment;

    const searchLower = searchText.toLowerCase();
    return equipment.filter((equip) =>
      equip.name.toLowerCase().includes(searchLower),
    );
  }, [equipment, searchText]);

  if (!equipment) {
    return (
      <View className="flex-1 bg-dark items-center justify-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-dark">
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Search Bar */}
        <View className="mx-4 mt-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="flex-row items-center bg-[#2c2c2e] rounded-xl px-3 py-2">
              <Ionicons name="search" size={20} color="#6F2DBD" />
              <TextInput
                className="flex-1 ml-3 text-white font-Poppins_400Regular"
                placeholder="Search equipment..."
                placeholderTextColor="#666"
                value={searchText}
                onChangeText={setSearchText}
              />
              {searchText && (
                <TouchableOpacity onPress={() => setSearchText("")}>
                  <Ionicons name="close-circle" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Equipment Stats */}
        <View className="mx-4 mb-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <View className="bg-[#6F2DBD] w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="stats-chart" size={20} color="#fff" />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Equipment Overview
              </Text>
            </View>

            <View className="flex-row justify-around">
              <View className="items-center">
                <Text className="text-white text-2xl font-Poppins_700Bold">
                  {equipment.length}
                </Text>
                <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                  Total Equipment
                </Text>
              </View>
              <View className="items-center">
                <Text className="text-white text-2xl font-Poppins_700Bold">
                  {filteredEquipment.length}
                </Text>
                <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                  {searchText ? "Matching" : "Available"}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Equipment List */}
        <View className="px-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-white text-xl font-Poppins_600SemiBold">
              {searchText ? "Search Results" : "All Equipment"}
            </Text>
            <Text className="text-gray-400 text-sm font-Poppins_400Regular">
              {filteredEquipment.length} item
              {filteredEquipment.length !== 1 ? "s" : ""}
            </Text>
          </View>

          {filteredEquipment.length === 0 ? (
            <View className="bg-[#1c1c1e] rounded-2xl p-6 items-center">
              <Ionicons name="search" size={48} color="#666" />
              <Text className="text-white text-lg font-Poppins_600SemiBold mt-4 mb-2">
                No equipment found
              </Text>
              <Text className="text-gray-400 text-sm font-Poppins_400Regular text-center">
                {searchText
                  ? "Try adjusting your search terms to find equipment."
                  : "No equipment available in the database."}
              </Text>
            </View>
          ) : (
            <View>
              {filteredEquipment.map((equip, index) => (
                <View key={equip._id} className={index > 0 ? "mt-4" : ""}>
                  <Link
                    href={`/(app)/(authenticated)/(modal)/equipment/${equip._id}`}
                    asChild
                  >
                    <TouchableOpacity className="bg-[#1c1c1e] rounded-2xl p-4">
                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center flex-1">
                          <View className="bg-[#6F2DBD] w-12 h-12 rounded-xl items-center justify-center mr-4">
                            <Ionicons
                              name="barbell-outline"
                              size={20}
                              color="#fff"
                            />
                          </View>

                          <View className="flex-1">
                            <Text className="text-white text-lg font-Poppins_600SemiBold mb-1">
                              {equip.name}
                            </Text>

                            <View className="flex-row items-center gap-3">
                              <Badge variant="outline">
                                <Text className="text-white text-xs">
                                  Equipment
                                </Text>
                              </Badge>

                              {/* Show exercise count if available */}
                              <Text className="text-gray-400 text-sm font-Poppins_400Regular">
                                ID: {equip._id.slice(-6)}
                              </Text>
                            </View>
                          </View>
                        </View>

                        <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center">
                          <Ionicons
                            name="chevron-forward"
                            size={20}
                            color="#fff"
                          />
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Link>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick Actions */}
        <View className="mx-4 mt-6">
          <View className="bg-[#1c1c1e] rounded-2xl p-4">
            <View className="flex-row items-center mb-4">
              <View className="bg-[#2c2c2e] w-10 h-10 rounded-xl items-center justify-center mr-3">
                <Ionicons name="flash-outline" size={20} color="#6F2DBD" />
              </View>
              <Text className="text-white text-lg font-Poppins_600SemiBold">
                Quick Actions
              </Text>
            </View>

            <TouchableOpacity
              onPress={() =>
                router.push("/(app)/(authenticated)/(modal)/exercises")
              }
              className="bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between mb-3"
            >
              <View className="flex-row items-center">
                <Ionicons name="list-outline" size={20} color="#6F2DBD" />
                <Text className="text-white font-Poppins_500Medium ml-3">
                  Browse All Exercises
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => router.push("/(app)/(authenticated)/(tabs)/home")}
              className="bg-[#2c2c2e] rounded-xl p-3 flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <Ionicons name="home-outline" size={20} color="#6F2DBD" />
                <Text className="text-white font-Poppins_500Medium ml-3">
                  Back to Home
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#6F2DBD" />
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

export default Page;
