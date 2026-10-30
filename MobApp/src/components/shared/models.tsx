import { useCars } from "@/hooks/use-cars";
import { ActivityIndicator, FlatList, StyleSheet } from "react-native";
import ModelCard from "../base/model-card";
import { EmptyView, ErrorView, LoadingView } from "./state-views";
import { layout } from "@/constant/layout";

interface ModelsProps {
    selectedSlug?: string;
    search?: string;
}

export default function Models({ selectedSlug = "", search = "" }: ModelsProps) {
    const { items, loading, refreshing, loadingMore, error, refresh, reload, loadMore } = useCars({
        brand: selectedSlug,
        search,
    });

    if (loading) return <LoadingView />;
    if (error && items.length === 0) return <ErrorView message={error} onRetry={reload} />;

    return (
        <FlatList
            data={items}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => <ModelCard model={item} />}
            refreshing={refreshing}
            onRefresh={refresh}
            onEndReached={loadMore}
            onEndReachedThreshold={0.4}
            contentContainerStyle={styles.modelsContainer}
            ListEmptyComponent={<EmptyView text="No cars found" />}
            ListFooterComponent={loadingMore ? <ActivityIndicator color={layout.colors.primary} /> : null}
            showsVerticalScrollIndicator={false}
        />
    )
}

const styles = StyleSheet.create({
    modelsContainer: {
        gap: 12,
        paddingBottom: 24,
    },
})
