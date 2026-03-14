/// Тесты модели посещаемости
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/attendance.dart';

void main() {
  group('Attendance', () {
    test('создание из JSON', () {
      final json = {
        'id': 'att1',
        'groupId': 'g1',
        'studentId': 's1',
        'date': '2026-03-14',
        'present': true,
      };

      final att = Attendance.fromJson(json);

      expect(att.id, 'att1');
      expect(att.groupId, 'g1');
      expect(att.studentId, 's1');
      expect(att.date, '2026-03-14');
      expect(att.present, true);
    });

    test('отсутствие (present = false)', () {
      final json = {
        'id': 'att2',
        'groupId': 'g1',
        'studentId': 's2',
        'date': '2026-03-14',
        'present': false,
      };

      final att = Attendance.fromJson(json);
      expect(att.present, false);
    });
  });

  group('AttendanceRecord', () {
    test('конвертация в JSON', () {
      const record = AttendanceRecord(studentId: 's1', present: true);
      final json = record.toJson();

      expect(json['studentId'], 's1');
      expect(json['present'], true);
    });

    test('конвертация отсутствия в JSON', () {
      const record = AttendanceRecord(studentId: 's2', present: false);
      final json = record.toJson();

      expect(json['studentId'], 's2');
      expect(json['present'], false);
    });
  });
}
