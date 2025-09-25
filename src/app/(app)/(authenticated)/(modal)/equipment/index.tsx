import { Badge } from "@/components/ui/Badge";
import { api } from "@/convex/_generated/api";
import { useCachedQuery } from "@/hooks/cache";
import { Ionicons } from "@expo/vector-icons";
import { LegendList } from "@legendapp/list";
import { Link } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const Page = () => {
  const [searchText, setSearchText] = useState("");

  // Get all equipment with exercise counts
  const { data: equipment } = useCachedQuery(
    api.exercises.getAllEquipmentWithCounts,
    {},
  );

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
      {/* Search Bar */}
      <View className="mx-4 mt-4 mb-4">
        <View className="flex-row items-center bg-[#2c2c2e] rounded-xl px-3 py-2">
          <Ionicons name="search" size={20} color="white" />
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

      {/* Equipment List */}
      <View className="px-4" style={{ flex: 1 }}>
        <View className="flex-row items-center justify-between mb-4">
          <Text className="text-white text-xl font-Poppins_600SemiBold">
            {filteredEquipment.length} Equipment
            {filteredEquipment.length !== 1 ? "" : ""}
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
          <LegendList
            data={filteredEquipment}
            keyExtractor={(item) => item._id}
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            renderItem={({ item: equip, index }) => (
              <View className={index > 0 ? "mt-4" : ""}>
                <Link
                  href={{
                    pathname: "/(app)/(authenticated)/(modal)/exercises/",
                    params: { equipmentIds: equip._id },
                  }}
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
                            {equip.name} ({(equip as any).exerciseCount})
                          </Text>

                          {(equip as any).exerciseTypes &&
                            (equip as any).exerciseTypes.length > 0 && (
                              <View className="flex-row items-center gap-2 flex-wrap">
                                {(equip as any).exerciseTypes
                                  .slice(0, 3)
                                  .map((type: string, index: number) => (
                                    <Badge
                                      key={type}
                                      variant="outline"
                                      className="bg-[#2c2c2e] border-[#444]"
                                    >
                                      <Text className="text-gray-400 text-xs">
                                        {type}
                                      </Text>
                                    </Badge>
                                  ))}
                                {(equip as any).exerciseTypes.length > 3 && (
                                  <Text className="text-gray-500 text-xs font-Poppins_400Regular">
                                    +{(equip as any).exerciseTypes.length - 3}{" "}
                                    more
                                  </Text>
                                )}
                              </View>
                            )}
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
            )}
          />
        )}
      </View>
    </View>
  );
};

export default Page;
