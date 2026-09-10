import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';


// The chef selects one of these — they cannot type a new course.
const COURSES = ['Starters', 'Mains', 'Desserts'];

export default function App() {
  // ---- Menu data ----
  // Every added dish lives in this single array, which is the "source of truth" the FlatList below renders from. Adding new item re-renders the list automatically because it is state.
  const [menuItems, setMenuItems] = useState([]);

  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [price, setPrice] = useState('');

  const handleAddDish = () => {
    // Basic validation so an incomplete or invalid item can't be added.
    if (!dishName.trim() || !description.trim() || !price.trim()) {
      Alert.alert('Missing information', 'Please fill in every field before adding a dish.');
      return;
    }

    const numericPrice = parseFloat(price);
    if (isNaN(numericPrice) || numericPrice <= 0) {
      Alert.alert('Invalid price', 'Please enter a valid price greater than 0.');
      return;
    }

    const newItem = {
      id: Date.now().toString(), // simple unique id for the FlatList key
      name: dishName.trim(),
      description: description.trim(),
      course: selectedCourse,
      price: numericPrice,
    };

    // Add the new dish to the existing array without mutating it directly. Using the array spread creates a new array reference, which is what triggers React to re-render the FlatList with the new item included.
    setMenuItems((currentItems) => [...currentItems, newItem]);

    // Clear the form so the chef can immediately capture the next dish.
    setDishName('');
    setDescription('');
    setPrice('');
    setSelectedCourse(COURSES[0]);
  };

  const renderMenuItem = ({ item }) => (
    <View style={styles.menuCard}>
      <View style={styles.menuCardHeader}>
        <Text style={styles.menuCardName}>{item.name}</Text>
        <Text style={styles.menuCardPrice}>R{item.price.toFixed(2)}</Text>
      </View>
      <Text style={styles.menuCardCourse}>{item.course}</Text>
      <Text style={styles.menuCardDescription}>{item.description}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />

      {/* ---- Header / application title ---- */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Christoffel's Kitchen</Text>
        <Text style={styles.headerSubtitle}>Menu Manager</Text>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---- Add Dish form ---- */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Add a Menu Item</Text>

            <Text style={styles.label}>Dish Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Butternut Soup"
              placeholderTextColor="#9A9A9A"
              value={dishName}
              onChangeText={setDishName}
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multilineInput]}
              placeholder="e.g. Roasted butternut, ginger and cream"
              placeholderTextColor="#9A9A9A"
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={3}
            />

            <Text style={styles.label}>Course</Text>
            <View style={styles.chipRow}>
              {COURSES.map((course) => {
                const isSelected = course === selectedCourse;
                return (
                  <TouchableOpacity
                    key={course}
                    style={[styles.chip, isSelected && styles.chipSelected]}
                    onPress={() => setSelectedCourse(course)}
                  >
                    <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                      {course}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.label}>Price (R)</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. 85.00"
              placeholderTextColor="#9A9A9A"
              value={price}
              onChangeText={setPrice}
              keyboardType="numeric"
            />

            <TouchableOpacity style={styles.addButton} onPress={handleAddDish}>
              <Text style={styles.addButtonText}>Add Dish to Menu</Text>
            </TouchableOpacity>
          </View>

          {/* ---- Menu list ---- */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Menu Items</Text>

            {menuItems.length === 0 ? (
              <Text style={styles.emptyText}>
                No dishes added yet. Use the form above to add your first menu item.
              </Text>
            ) : (
              <FlatList
                data={menuItems}
                keyExtractor={(item) => item.id}
                renderItem={renderMenuItem}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const GREEN = '#2C6E5A';
const DARK = '#222222';
const GREY_BG = '#F5F5F5';
const BORDER = '#DDDDDD';

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: {
    flex: 1,
    backgroundColor: GREY_BG,
  },
  header: {
    backgroundColor: GREEN,
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#E4F1EC',
    marginTop: 2,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: DARK,
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#555555',
    marginBottom: 6,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
    color: DARK,
    backgroundColor: '#FAFAFA',
  },
  multilineInput: {
    minHeight: 70,
    textAlignVertical: 'top',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  chip: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
    marginBottom: 8,
    backgroundColor: '#FAFAFA',
  },
  chipSelected: {
    backgroundColor: GREEN,
    borderColor: GREEN,
  },
  chipText: {
    fontSize: 14,
    color: '#555555',
    fontWeight: '600',
  },
  chipTextSelected: {
    color: '#FFFFFF',
  },
  addButton: {
    backgroundColor: GREEN,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 18,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  listSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  emptyText: {
    fontSize: 14,
    color: '#888888',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 20,
  },
  menuCard: {
    paddingVertical: 12,
  },
  menuCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  menuCardName: {
    fontSize: 16,
    fontWeight: '700',
    color: DARK,
    flexShrink: 1,
    marginRight: 8,
  },
  menuCardPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: GREEN,
  },
  menuCardCourse: {
    fontSize: 12,
    fontWeight: '600',
    color: GREEN,
    marginTop: 4,
    textTransform: 'uppercase',
  },
  menuCardDescription: {
    fontSize: 14,
    color: '#666666',
    marginTop: 6,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: BORDER,
  },
});
