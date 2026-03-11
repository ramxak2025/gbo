/// Тесты модели учебного материала
///
/// Проверяет парсинг JSON, работу с groupIds.
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/material.dart';

void main() {
  group('TrainingMaterial', () {
    test('создание из JSON', () {
      final json = {
        'id': 'm1',
        'trainerId': 't1',
        'title': 'Техника удара',
        'description': 'Обучающее видео',
        'videoUrl': 'https://youtube.com/watch?v=test',
        'groupIds': ['g1', 'g2'],
        'category': 'technique',
        'customThumb': '',
        'createdAt': '2024-01-01T00:00:00.000Z',
      };

      final material = TrainingMaterial.fromJson(json);

      expect(material.id, 'm1');
      expect(material.title, 'Техника удара');
      expect(material.videoUrl, 'https://youtube.com/watch?v=test');
      expect(material.groupIds, ['g1', 'g2']);
      expect(material.category, 'technique');
    });

    test('значения по умолчанию', () {
      final json = {
        'id': 'm2',
        'trainerId': 't1',
        'title': 'Тест',
        'videoUrl': 'https://example.com',
      };

      final material = TrainingMaterial.fromJson(json);

      expect(material.description, '');
      expect(material.groupIds, isEmpty);
      expect(material.category, 'other');
      expect(material.customThumb, '');
    });

    test('конвертация в JSON', () {
      const material = TrainingMaterial(
        id: 'm1',
        trainerId: 't1',
        title: 'Тест',
        videoUrl: 'https://example.com',
        category: 'sparring',
      );

      final json = material.toJson();

      expect(json['title'], 'Тест');
      expect(json['category'], 'sparring');
    });
  });
}
