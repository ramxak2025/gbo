package ru.iborcuha.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

import ru.iborcuha.app.data.models.*
import ru.iborcuha.app.ui.components.LiquidGlassCard
import ru.iborcuha.app.ui.theme.*

@Composable
fun CashScreen(
    data: DataBundle,
    userId: String,
) {
    Box(Modifier.fillMaxSize().background(BgDark)) {
        Box(Modifier.offset((-60).dp, (-40).dp).size(280.dp).clip(CircleShape).background(Purple.copy(0.15f)))

        Column(
            Modifier
                .fillMaxSize()
                .verticalScroll(rememberScrollState())
                .padding(horizontal = 16.dp)
                .padding(top = 60.dp, bottom = 140.dp)
        ) {
            Text(
                "Касса",
                fontSize = 28.sp,
                fontWeight = FontWeight.Black,
                color = Color.White,
                modifier = Modifier.padding(bottom = 20.dp),
            )

            val myTx = data.transactions.filter { it.trainerId == userId }
            val income = myTx.filter { it.type == "income" }.sumOf { it.amount }
            val expense = myTx.filter { it.type == "expense" }.sumOf { it.amount }
            val balance = income - expense

            LiquidGlassCard(Modifier.fillMaxWidth(), radius = 28.dp, padding = 20.dp) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(Modifier.size(50.dp).clip(CircleShape).background(Brush.linearGradient(listOf(Color(0xFF6366F1), Color(0xFF8B5CF6)))), contentAlignment = Alignment.Center) {
                        Icon(Icons.Filled.AccountBalanceWallet, null, tint = Color.White, modifier = Modifier.size(26.dp))
                    }
                    Spacer(Modifier.width(14.dp))
                    Column {
                        Text("ОБЩИЙ БАЛАНС", fontSize = 11.sp, fontWeight = FontWeight.Bold, color = TextTertiary, letterSpacing = 1.sp)
                        Spacer(Modifier.height(4.dp))
                        Text("${if (balance >= 0) "+" else ""}${"%,d".format(balance)} ₽", fontSize = 32.sp, fontWeight = FontWeight.Black, color = if (balance >= 0) Success else Danger)
                    }
                }
            }

            Spacer(Modifier.height(20.dp))
            Text("Транзакции", fontSize = 18.sp, fontWeight = FontWeight.Bold, color = Color.White, modifier = Modifier.padding(bottom = 12.dp))

            myTx.sortedByDescending { it.date }.take(20).forEach { tx ->
                LiquidGlassCard(Modifier.fillMaxWidth().padding(bottom = 8.dp), radius = 16.dp, padding = 14.dp) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(
                            if (tx.type == "income") Icons.Filled.ArrowDownward else Icons.Filled.ArrowUpward,
                            null,
                            tint = if (tx.type == "income") Success else Danger,
                            modifier = Modifier.size(20.dp),
                        )
                        Spacer(Modifier.width(10.dp))
                        Column(Modifier.weight(1f)) {
                            Text(tx.description.ifEmpty { tx.category.ifEmpty { tx.type } }, fontSize = 14.sp, fontWeight = FontWeight.SemiBold, color = Color.White)
                        }
                        Text(
                            "${if (tx.type == "income") "+" else "−"}${"%,d".format(tx.amount)} ₽",
                            fontSize = 15.sp,
                            fontWeight = FontWeight.Bold,
                            color = if (tx.type == "income") Success else Danger,
                        )
                    }
                }
            }
        }
    }
}

