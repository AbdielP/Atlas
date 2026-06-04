import { Modal, View, Text, Pressable } from "react-native";

export default function CountryMenu({
    visible,
    country,
    onVisited,
    onWishlist,
    onClear,
    onClose
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <View
                style={{
                    flex: 1,
                    justifyContent: "center",
                    alignItems: "center",
                    backgroundColor: "rgba(0,0,0,0.5)"
                }}
            >
                <View
                    style={{
                        width: 280,
                        padding: 20,
                        borderRadius: 12,
                        backgroundColor: "#ffffff"
                    }}
                >
                    <Text
                        style={{
                            fontSize: 18,
                            fontWeight: "bold",
                            marginBottom: 16
                        }}
                    >
                        {country?.name}
                    </Text>

                    <Pressable onPress={onVisited}>
                        <Text style={{ paddingVertical: 12 }}>
                            Visited
                        </Text>
                    </Pressable>

                    <Pressable onPress={onWishlist}>
                        <Text style={{ paddingVertical: 12 }}>
                            Wishlist
                        </Text>
                    </Pressable>

                    <Pressable onPress={onClear}>
                        <Text style={{ paddingVertical: 12 }}>
                            Clear
                        </Text>
                    </Pressable>

                    <Pressable onPress={onClose}>
                        <Text
                            style={{
                                paddingVertical: 12,
                                color: "red"
                            }}
                        >
                            Cancel
                        </Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}