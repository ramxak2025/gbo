package ru.iborcuha.app.data.models

data class User(
    val id: String,
    val name: String,
    val phone: String,
    val role: String, // superadmin | trainer | student
    val avatar: String? = null,
    val clubName: String? = null,
    val clubId: String? = null,
    val isHeadTrainer: Boolean = false,
    val sportType: String? = null,
    val sportTypes: List<String> = emptyList(),
    val city: String? = null,
    val plainPassword: String? = null,
    val materialCategories: List<String> = emptyList(),
)

data class Student(
    val id: String,
    val trainerId: String,
    val groupId: String? = null,
    val name: String,
    val phone: String,
    val weight: Double? = null,
    val belt: String? = null,
    val birthDate: String? = null,
    val avatar: String? = null,
    val subscriptionExpiresAt: String? = null,
    val status: String? = null, // sick | injury | skip | null
    val trainingStartDate: String? = null,
    val createdAt: String = "",
    val plainPassword: String? = null,
)

data class Group(
    val id: String,
    val trainerId: String,
    val name: String,
    val schedule: String = "",
    val subscriptionCost: Int = 0,
    val attendanceEnabled: Boolean = false,
    val sportType: String? = null,
    val pinnedMaterialId: String? = null,
)

data class Transaction(
    val id: String,
    val trainerId: String,
    val type: String, // income | expense
    val amount: Int,
    val category: String = "",
    val description: String = "",
    val studentId: String? = null,
    val date: String = "",
)

data class Tournament(
    val id: String,
    val title: String,
    val coverImage: String? = null,
    val date: String = "",
    val location: String = "",
    val description: String = "",
    val createdBy: String? = null,
)

data class Attendance(
    val id: String,
    val groupId: String,
    val studentId: String,
    val date: String,
    val present: Boolean,
)

data class Material(
    val id: String,
    val trainerId: String,
    val title: String,
    val description: String = "",
    val videoUrl: String = "",
    val groupIds: List<String> = emptyList(),
    val category: String = "",
    val customThumb: String? = null,
    val createdAt: String = "",
)

data class News(
    val id: String,
    val trainerId: String,
    val groupId: String? = null,
    val title: String,
    val content: String = "",
    val date: String = "",
)

data class Club(
    val id: String,
    val name: String,
    val city: String = "",
    val sportTypes: List<String> = emptyList(),
    val headTrainerId: String? = null,
    val createdAt: String = "",
)

data class InternalTournament(
    val id: String,
    val trainerId: String,
    val title: String,
    val date: String? = null,
    val status: String = "active",
    val sportType: String? = null,
    val coverImage: String? = null,
    val createdAt: String = "",
)

data class AuthorInfo(
    val name: String? = null,
    val instagram: String? = null,
    val website: String? = null,
    val description: String? = null,
    val phone: String? = null,
)

data class TournamentRegistration(
    val tournamentId: String,
    val studentId: String,
)

data class DataBundle(
    val users: List<User> = emptyList(),
    val students: List<Student> = emptyList(),
    val groups: List<Group> = emptyList(),
    val transactions: List<Transaction> = emptyList(),
    val tournaments: List<Tournament> = emptyList(),
    val news: List<News> = emptyList(),
    val tournamentRegistrations: List<TournamentRegistration> = emptyList(),
    val authorInfo: AuthorInfo? = null,
    val internalTournaments: List<InternalTournament> = emptyList(),
    val attendance: List<Attendance> = emptyList(),
    val materials: List<Material> = emptyList(),
    val clubs: List<Club> = emptyList(),
)

data class LoginRequest(val phone: String, val password: String)

data class LoginResponse(
    val token: String,
    val userId: String,
    val role: String,
    val user: User,
    val student: Student? = null,
    val studentId: String? = null,
)
