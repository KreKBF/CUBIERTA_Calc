/*
<div><small>Ориентировочная стоимость:</small> <b>{moneyFmt(quote.estimatedCostCents, quote.currency)}</b></div>
<div><small>Предоплата (10%):</small> <b>{moneyFmt(quote.depositCents, quote.currency)}</b></div>
<div style={{ fontSize: 12, color: '#666', marginTop: 6 }}>Предоплата — аванс за материалы для шаблона и снятие шаблона на борту.</div>
</div>
) : (
<div style={{ padding: 12, background: '#fff3cd', borderRadius: 12, marginTop: 8 }}>
<div style={{ marginBottom: 8 }}>Нет данных расчёта. Сначала выполните расчёт.</div>
<Link to="/calc" style={{ display: 'inline-block', padding: '10px 14px', borderRadius: 10, background: '#000', color: '#fff' }}>Перейти к расчёту</Link>
</div>
)}


<form onSubmit={submit} style={{ display: 'grid', gap: 12, marginTop: 16 }}>
<div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
<input name="name" placeholder="Имя" value={form.name} onChange={onChange} required />
<input name="surname" placeholder="Фамилия" value={form.surname} onChange={onChange} required />
</div>
<div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
<input name="phone" placeholder="Телефон (обязательно)" value={form.phone} onChange={onChange} required />
<input name="email" type="email" placeholder="Email (по желанию)" value={form.email} onChange={onChange} />
</div>
<div style={{ display: 'grid', gap: 12, gridTemplateColumns: '1fr 1fr' }}>
<input name="marina" placeholder="Марина базирования" value={form.marina} onChange={onChange} />
<input name="boatMakeModel" placeholder="Марка/модель лодки (опционально)" value={form.boatMakeModel} onChange={onChange} />
</div>


<div>
<div style={{ marginBottom: 6 }}>Предпочтительный способ связи</div>
{['call','whatsapp','telegram'].map((m) => (
<label key={m} style={{ marginRight: 12 }}>
<input type="radio" name="contactMethod" value={m} checked={form.contactMethod===m} onChange={onChange} />{' '}
{m==='call'?'Звонок':m==='whatsapp'?'WhatsApp':'Telegram'}
</label>
))}
</div>


<label>
<input type="checkbox" name="confirmDeposit" checked={form.confirmDeposit} onChange={onChange} required />{' '}
Подтверждаю готовность начать проект с внесения предоплаты в размере <b>{moneyFmt(quote?.depositCents||0, quote?.currency||'eur')}</b>
</label>


<button type="submit" style={{ padding: '12px 18px', borderRadius: 14, background: '#000', color: '#fff', fontWeight: 600 }}>Подать заявку</button>
</form>
</div>
);
}
*/
