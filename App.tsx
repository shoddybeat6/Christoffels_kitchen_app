import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  KeyboardAvoidingView,
  ScrollView,
  Alert,
  StatusBar,
  SafeAreaView,
  Platform,
} from 'react-native';


// The chef selects one of these — they cannot type a new course.
const COURSES = ['Starters', 'Mains', 'Desserts'];

type MenuItem = {
  id: string;
  name: string;
  description: string;
  course: string;
  price: number;
};

export default function App() {
  // ---- Menu data ----
  // Every added dish lives in this single array, which is the
  // "source of truth" the FlatList below renders from. Adding a
  // new item re-renders the list automatically because it is state.
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  // ---- Form field state (controlled inputs) ----
  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(COURSES[0]);
  const [price, setPrice] = useState('');

  // ---- Final PoE state ----
  // editingId: the id of the dish being edited (null when adding a new dish)
  // searchQuery / filterCourse: control what the menu list shows
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCourse, setFilterCourse] = useState('All');
  const scrollRef = useRef<ScrollView>(null);

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

    // Add the new dish to the existing array without mutating it directly.
    // Using the array spread creates a new array reference, which is what
    // triggers React to re-render the FlatList with the new item included.
    if (editingId) {
      // Editing: replace the matching dish, keeping its original id.
      setMenuItems((currentItems) =>
        currentItems.map((item) =>
          item.id === editingId ? { ...newItem, id: editingId } : item
        )
      );
    } else {
      setMenuItems((currentItems) => [...currentItems, newItem]);
    }

    // Clear the form so the chef can immediately capture the next dish.
    setDishName('');
    setDescription('');
    setPrice('');
    setSelectedCourse(COURSES[0]);
    setEditingId(null);
  };

  // ---- Edit ----
  // Loads the chosen dish into the form and scrolls up to it.
  const handleEditDish = (item: MenuItem) => {
    setEditingId(item.id);
    setDishName(item.name);
    setDescription(item.description);
    setSelectedCourse(item.course);
    setPrice(item.price.toString());
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setDishName('');
    setDescription('');
    setPrice('');
    setSelectedCourse(COURSES[0]);
  };

  // ---- Delete ----
  const removeDish = (id: string) => {
    setMenuItems((currentItems) => currentItems.filter((item) => item.id !== id));
    if (editingId === id) {
      handleCancelEdit(); // don't keep editing a dish that no longer exists
    }
  };

  const handleDeleteDish = (item: MenuItem) => {
    // Ask first so a dish isn't removed by an accidental tap.
    // (Alert buttons don't work in the browser, so use confirm() there.)
    if (Platform.OS === 'web') {
      if (window.confirm(`Remove "${item.name}" from the menu?`)) {
        removeDish(item.id);
      }
      return;
    }
    Alert.alert('Remove dish', `Remove "${item.name}" from the menu?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Remove', style: 'destructive', onPress: () => removeDish(item.id) },
    ]);
  };

  // ---- Search + filter ----
  // The list shows only dishes that match the search text AND the chosen course.
  const query = searchQuery.trim().toLowerCase();
  const filteredItems = menuItems.filter((item) => {
    const matchesCourse = filterCourse === 'All' || item.course === filterCourse;
    const matchesSearch =
      query === '' ||
      item.name.toLowerCase().includes(query) ||
      item.description.toLowerCase().includes(query);
    return matchesCourse && matchesSearch;
  });
  const filtersActive = query !== '' || filterCourse !== 'All';

  const clearFilters = () => {
    setSearchQuery('');
    setFilterCourse('All');
  };

  // ---- Menu statistics (always calculated from the whole menu) ----
  const averagePrice =
    menuItems.length > 0
      ? menuItems.reduce((sum, item) => sum + item.price, 0) / menuItems.length
      : 0;
  const courseStats = COURSES.map((course) => {
    const inCourse = menuItems.filter((item) => item.course === course);
    const avg =
      inCourse.length > 0
        ? inCourse.reduce((sum, item) => sum + item.price, 0) / inCourse.length
        : 0;
    return { course, count: inCourse.length, average: avg };
  });
  const mostExpensive =
    menuItems.length > 0
      ? menuItems.reduce((max, item) => (item.price > max.price ? item : max))
      : null;
  const cheapest =
    menuItems.length > 0
      ? menuItems.reduce((min, item) => (item.price < min.price ? item : min))
      : null;

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <View style={[styles.menuCard, item.id === editingId && styles.menuCardEditing]}>
      <View style={styles.menuCardHeader}>
        <Text style={styles.menuCardName}>{item.name}</Text>
        <Text style={styles.menuCardPrice}>R{item.price.toFixed(2)}</Text>
      </View>
      <Text style={styles.menuCardCourse}>{item.course}</Text>
      <Text style={styles.menuCardDescription}>{item.description}</Text>

      <View style={styles.actionRow}>
        <TouchableOpacity style={styles.editButton} onPress={() => handleEditDish(item)}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeleteDish(item)}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      </View>
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
          ref={scrollRef}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* ---- Add Dish form ---- */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>
              {editingId ? 'Edit Menu Item' : 'Add a Menu Item'}
            </Text>

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
              <Text style={styles.addButtonText}>
                {editingId ? 'Save Changes' : 'Add Dish to Menu'}
              </Text>
            </TouchableOpacity>

            {editingId && (
              <TouchableOpacity style={styles.cancelButton} onPress={handleCancelEdit}>
                <Text style={styles.cancelButtonText}>Cancel Editing</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* ---- Menu statistics ---- */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Menu Statistics</Text>
            <View style={styles.statRow}>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{menuItems.length}</Text>
                <Text style={styles.statLabel}>Total dishes</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>R{averagePrice.toFixed(2)}</Text>
                <Text style={styles.statLabel}>Average price</Text>
              </View>
            </View>

            {courseStats.map((stat) => (
              <View key={stat.course} style={styles.courseStatRow}>
                <Text style={styles.courseStatName}>{stat.course}</Text>
                <Text style={styles.courseStatDetail}>
                  {stat.count} {stat.count === 1 ? 'dish' : 'dishes'} · avg R{stat.average.toFixed(2)}
                </Text>
              </View>
            ))}

            {mostExpensive && cheapest && (
              <View style={styles.extremesBox}>
                <Text style={styles.extremesText}>
                  Most expensive: {mostExpensive.name} (R{mostExpensive.price.toFixed(2)})
                </Text>
                <Text style={styles.extremesText}>
                  Cheapest: {cheapest.name} (R{cheapest.price.toFixed(2)})
                </Text>
              </View>
            )}
          </View>

          {/* ---- Menu list ---- */}
          <View style={styles.listSection}>
            <Text style={styles.sectionTitle}>Menu Items</Text>

            {menuItems.length > 0 && (
              <View>
                <TextInput
                  style={styles.input}
                  placeholder="Search by dish name or description"
                  placeholderTextColor="#9A9A9A"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCorrect={false}
                />

                <View style={[styles.chipRow, styles.filterRow]}>
                  {['All', ...COURSES].map((course) => {
                    const isSelected = course === filterCourse;
                    return (
                      <TouchableOpacity
                        key={course}
                        style={[styles.chip, isSelected && styles.chipSelected]}
                        onPress={() => setFilterCourse(course)}
                      >
                        <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                          {course}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                <View style={styles.resultsRow}>
                  <Text style={styles.resultsText}>
                    Showing {filteredItems.length} of {menuItems.length}{' '}
                    {menuItems.length === 1 ? 'dish' : 'dishes'}
                  </Text>
                  {filtersActive && (
                    <TouchableOpacity onPress={clearFilters}>
                      <Text style={styles.clearText}>Clear filters</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>
            )}

            {menuItems.length === 0 ? (
              <Text style={styles.emptyText}>
                No dishes added yet. Use the form above to add your first menu item.
              </Text>
            ) : filteredItems.length === 0 ? (
              <Text style={styles.emptyText}>
                No dishes match your search or filter.
              </Text>
            ) : (
              <FlatList
                data={filteredItems}
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
  // ---- Final PoE styles ----
  menuCardEditing: {
    backgroundColor: '#E8F3EF',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  actionRow: {
    flexDirection: 'row',
    marginTop: 10,
  },
  editButton: {
    borderWidth: 1,
    borderColor: GREEN,
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  editButtonText: {
    color: GREEN,
    fontSize: 13,
    fontWeight: '700',
  },
  deleteButton: {
    borderWidth: 1,
    borderColor: '#B3261E',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  deleteButtonText: {
    color: '#B3261E',
    fontSize: 13,
    fontWeight: '700',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  cancelButtonText: {
    color: '#555555',
    fontSize: 15,
    fontWeight: '600',
  },
  filterRow: {
    marginTop: 12,
  },
  resultsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  resultsText: {
    fontSize: 13,
    color: '#666666',
  },
  clearText: {
    fontSize: 13,
    fontWeight: '700',
    color: GREEN,
  },
  statRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#E8F3EF',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginRight: 10,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '700',
    color: GREEN,
  },
  statLabel: {
    fontSize: 12,
    color: '#555555',
    marginTop: 2,
  },
  courseStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  courseStatName: {
    fontSize: 14,
    fontWeight: '600',
    color: DARK,
  },
  courseStatDetail: {
    fontSize: 14,
    color: '#666666',
  },
  extremesBox: {
    marginTop: 10,
  },
  extremesText: {
    fontSize: 13,
    color: '#555555',
    lineHeight: 20,
  },
});
