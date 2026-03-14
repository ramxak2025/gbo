/// Тесты модели информации об авторе
import 'package:flutter_test/flutter_test.dart';
import 'package:iborcuha/models/author_info.dart';

void main() {
  group('AuthorInfo', () {
    test('создание из JSON', () {
      final json = {
        'name': 'Иван Петров',
        'instagram': 'ivan_coach',
        'website': 'https://example.com',
        'description': 'Тренер',
        'phone': '89001234567',
      };

      final info = AuthorInfo.fromJson(json);

      expect(info.name, 'Иван Петров');
      expect(info.instagram, 'ivan_coach');
      expect(info.website, 'https://example.com');
      expect(info.description, 'Тренер');
      expect(info.phone, '89001234567');
    });

    test('создание с null полями', () {
      final json = <String, dynamic>{};

      final info = AuthorInfo.fromJson(json);

      expect(info.name, isNull);
      expect(info.instagram, isNull);
      expect(info.website, isNull);
    });

    test('конвертация в JSON', () {
      const info = AuthorInfo(
        name: 'Тест',
        instagram: 'test',
        phone: '123',
      );

      final json = info.toJson();

      expect(json['name'], 'Тест');
      expect(json['instagram'], 'test');
      expect(json['phone'], '123');
      expect(json['website'], isNull);
    });
  });
}
