function showNotification(type, message) {
  const icons = {
    success: '✓',
    error: '✗',
    warning: '⚠',
    info: 'ℹ'
  };

  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.innerHTML = `
    <span class="notification-icon">${icons[type]}</span>
    <span class="notification-content">${message}</span>
    <button class="notification-close" onclick="this.parentElement.remove()">×</button>
  `;

  document.body.appendChild(notification);

  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
  }, 3000);
}

function showSuccess(message) {
  showNotification('success', message);
}

function showError(message) {
  showNotification('error', message);
}

function showWarning(message) {
  showNotification('warning', message);
}

function showInfo(message) {
  showNotification('info', message);
}

function validateField(field, rules) {
  const value = field.value.trim();
  const formGroup = field.closest('.form-group');
  let error = null;

  if (rules.required && !value) {
    error = '此字段为必填项';
  }

  if (rules.email && value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    error = '请输入有效的邮箱地址';
  }

  if (rules.phone && value && !/^1[3-9]\d{9}$/.test(value)) {
    error = '请输入有效的手机号码';
  }

  if (rules.minLength && value && value.length < rules.minLength) {
    error = `至少需要输入${rules.minLength}个字符`;
  }

  if (rules.maxLength && value && value.length > rules.maxLength) {
    error = `最多允许输入${rules.maxLength}个字符`;
  }

  if (rules.pattern && value && !rules.pattern.test(value)) {
    error = rules.patternMessage || '格式不正确';
  }

  if (formGroup) {
    const errorEl = formGroup.querySelector('.form-error');
    const successEl = formGroup.querySelector('.form-success');

    if (error) {
      field.classList.remove('success');
      field.classList.add('error');
      if (errorEl) {
        errorEl.textContent = error;
        errorEl.style.display = 'flex';
      }
      if (successEl) {
        successEl.style.display = 'none';
      }
      return false;
    } else {
      field.classList.remove('error');
      field.classList.add('success');
      if (errorEl) {
        errorEl.style.display = 'none';
      }
      if (successEl) {
        successEl.style.display = 'flex';
      }
      return true;
    }
  }

  return !error;
}