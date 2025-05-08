import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  Text,
  TextInput,
  Button,
  FlatList,
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import firestore, { FirebaseFirestoreTypes } from '@react-native-firebase/firestore';

// Định nghĩa kiểu dữ liệu Todo
type Todo = {
  id: string;
  text: string;
  createdAt: FirebaseFirestoreTypes.Timestamp | null;
};

export default function App() {
  const [todo, setTodo] = useState(''); // State để lưu input của người dùng
  const [todos, setTodos] = useState<Todo[]>([]); // State để lưu danh sách todo từ Firestore

  // Lấy danh sách todo từ Firestore khi component được render
  useEffect(() => {
    const unsubscribe = firestore()
      .collection('todos')
      .orderBy('createdAt', 'desc') // Sắp xếp theo thời gian tạo
      .onSnapshot(
        snapshot => {
          if (snapshot && snapshot.docs) {
            // Chuyển đổi dữ liệu từ snapshot thành danh sách todo
            const items: Todo[] = snapshot.docs.map(doc => ({
              id: doc.id, // Firebase tự động tạo ID cho mỗi tài liệu
              text: doc.data().text,
              createdAt: doc.data().createdAt || null, // Kiểm tra và lấy thời gian tạo
            }));
            setTodos(items); // Cập nhật danh sách todos
          } else {
            console.error('Snapshot is empty or null');
          }
        },
        error => {
          console.error('Error fetching todos: ', error);
        }
      );

    return () => unsubscribe(); // Dọn dẹp khi component bị unmount
  }, []);

  // Chức năng thêm todo vào Firestore
  const addTodo = async () => {
    if (todo.trim().length === 0) return; // Kiểm tra nếu ô input trống

    await firestore().collection('todos').add({
      text: todo,
      createdAt: firestore.FieldValue.serverTimestamp(), // Thêm thời gian server
    });

    setTodo(''); // Xóa nội dung ô input sau khi thêm
  };

  // Chức năng xóa todo khỏi Firestore
  const deleteTodo = async (id: string) => {
    await firestore().collection('todos').doc(id).delete();
  };

  // Chức năng render mỗi item trong FlatList
  const renderItem = ({ item }: { item: Todo }) => (
    <View style={styles.todoItem}>
      <Text style={styles.todoText}>{item.text}</Text>
      {item.createdAt && (
        <Text style={styles.createdAtText}>
          {item.createdAt.toDate().toLocaleString()} {/* Hiển thị thời gian */}
        </Text>
      )}
      <TouchableOpacity onPress={() => deleteTodo(item.id)}>
        <Text style={styles.deleteText}>X</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Firebase Todo App</Text>

      {/* Ô input để thêm task mới */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Add a new task"
          value={todo}
          onChangeText={setTodo} // Cập nhật state `todo` khi người dùng nhập
        />
        <Button title="Add" onPress={addTodo} /> {/* Nút để thêm task */}
      </View>

      {/* Danh sách các todo */}
      <FlatList
        data={todos} // Danh sách todo từ state `todos`
        keyExtractor={item => item.id} // Dùng `id` của mỗi item làm khóa duy nhất
        renderItem={renderItem} // Hàm render mỗi item
      />
    </SafeAreaView>
  );
}

// Style cho ứng dụng
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  inputContainer: { flexDirection: 'row', marginBottom: 12 },
  input: { flex: 1, borderWidth: 1, borderColor: '#ccc', marginRight: 8, padding: 8 },
  todoItem: {
    flexDirection: 'row', justifyContent: 'space-between',
    padding: 12, backgroundColor: '#f9f9f9', marginBottom: 8, borderRadius: 6,
  },
  todoText: { fontSize: 16 },
  createdAtText: { fontSize: 12, color: '#666' }, // Hiển thị thời gian với kích thước nhỏ
  deleteText: { color: 'red', fontWeight: 'bold' },
});
