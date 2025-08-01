import bcrypt from 'bcrypt';
import systemConfig from '../../configs/system.config.js';
import { saltRoundsConst } from '../../constants/account.constant.js';
import alertMessageHelper from '../../helpers/alertMessagge.helper.js';
import paginationHelper from '../../helpers/pagination.helper.js';
import searchHelper from '../../helpers/search.helper.js';
import statusFilterHelper from '../../helpers/statusFilter.helper.js';
import accountModel from '../../models/account.model.js';
import roleModel from '../../models/role.model.js';

// GET: /admin/accounts     --Hiển thị danh sách tài khoản
const account = async (req, res) => {
  const find = {
    deleted: false,
  };

  // Search
  const objSearch = searchHelper(req.query);
  if (objSearch.rexKeywordString) find.fullName = objSearch.rexKeywordString;

  // Status Filter
  const activeStatus = statusFilterHelper(req.query);
  if (req.query.status) find.status = req.query.status;

  // Pagination
  const paginationObj = {
    limit: 4,
    currentPage: 1,
  };
  const productTotal = await accountModel.countDocuments(find);
  const objPagination = paginationHelper(req.query, paginationObj, productTotal);

  const roleList = await roleModel.find(find);

  const accountList = await accountModel
    .find(find)
    .limit(objPagination.limit)
    .skip(objPagination.productSkip);

  for (const account of accountList) {
    const role = await roleModel.findOne({
      _id: account.roleId,
      deleted: false,
    });
    if (role) account.roleId = role.title;
  }

  res.render('./admin/pages/account/account.view.ejs', {
    pageTitle: 'Danh sách tài khoản',
    activeLink: 'active',
    accountList,
    roleList,
    activeStatus,
    keyword: objSearch.keyword,
    objPagination,
  });
};

// GET: /admin/accounts/create    --Tới trang tạo tài khoản
const createAccountGet = async (req, res) => {
  const find = {
    deleted: false,
  };
  const roleList = await roleModel.find(find).select('_id title');

  res.render('./admin/pages/account/create.view.ejs', {
    pageTitle: 'Thêm mới tài khoản',
    roleList,
  });
};

// POST: /admin/accounts/create     --Tạo tài khoản mới
const createAccountPost = async (req, res) => {
  try {
    const hassPassword = await bcrypt.hash(req.body.password, saltRoundsConst);
    if (req.body.password) req.body.password = hassPassword;

    const newAccount = new accountModel(req.body);
    await newAccount.save();

    alertMessageHelper(req, 'alertSuccess', 'Tạo thành công');
    res.redirect(`${systemConfig.prefixAdmin}/accounts`);
  } catch (err) {
    console.log('Create account fail: ', err);
    alertMessageHelper(req, 'alertFailure', 'Tạo thất bại');
    res.redirect('back');
  }
};

// GET: /admin/accounts/update/:id     --Tới trang cập nhật tài khoản
const updateAccountGet = async (req, res) => {
  const id = req.params.id;
  const find = {
    _id: id,
    deleted: false,
  };

  try {
    const account = await accountModel.findOne(find).select('-token');
    const roleList = await roleModel.find({ deleted: false });

    res.render('./admin/pages/account/update.view.ejs', {
      pageTitle: 'Chỉnh sửa tài khoản',
      account,
      roleList,
    });
  } catch (err) {
    console.log('Not found: ', err);
    alertMessageHelper(req, 'alertFailure', 'Not found');
    res.redirect('back');
  }
};

// PATCH: /admin/accounts/update/:id     --Cập nhật tài khoản
const updateAccountPatch = async (req, res) => {
  try {
    const id = req.params.id;
    const hassPassword = await bcrypt.hash(req.body.password, saltRoundsConst);

    if (req.body.password) req.body.password = hassPassword;

    await accountModel.findByIdAndUpdate(id, req.body);
    alertMessageHelper(req, 'alertSuccess', 'Cập nhật thành công');
  } catch (err) {
    console.log('Create product fail: ', err);
    alertMessageHelper(req, 'alertFailure', 'Cập nhật thất bại');
  } finally {
    res.redirect('back');
  }
};

// PATCH: /admin/accounts/change-status/:status/:id?_method=PATCH     --Đổi trạng thái tài khoản
const changeStatusAccount = async (req, res) => {
  try {
    const { id, status } = req.params;

    await accountModel.findByIdAndUpdate(id, {
      status: status,
    });
    alertMessageHelper(req, 'alertSuccess', 'Cập nhật trạng thái thành công');
  } catch (err) {
    console.log('Update product fail: ', err);
    alertMessageHelper(req, 'alertFailure', 'Cập nhật trạng thái thất bại');
  } finally {
    res.redirect('back');
  }
};

// PATCH: /admin/accounts/change-multi?_method=PATCH
const changeMultiAccount = async (req, res) => {
  try {
    if (req.body.type && req.body.ids) {
      const { type, ids } = req.body;
      const idsArr = ids.split(', ');

      switch (type) {
        case 'active': {
          try {
            await accountModel.updateMany({ _id: { $in: idsArr } }, { $set: { status: 'active' } });
            alertMessageHelper(req, 'alertSuccess', `Cập nhật trạng thái thành công`);
          } catch (err) {
            alertMessageHelper(req, 'alertFailure', 'Cập nhật trạng thái thất bại');
          } finally {
            res.redirect('back');
            break;
          }
        }
        case 'inactive': {
          try {
            await accountModel.updateMany(
              { _id: { $in: idsArr } },
              { $set: { status: 'inactive' } }
            );
            alertMessageHelper(req, 'alertSuccess', `Cập nhật trạng thái thành công`);
          } catch (err) {
            alertMessageHelper(req, 'alertFailure', 'Cập nhật trạng thái bại');
          } finally {
            res.redirect('back');
            break;
          }
        }
        case 'soft-delete': {
          try {
            await accountModel.updateMany(
              { _id: { $in: idsArr } },
              { $set: { deleted: true, deletedAt: new Date() } }
            );
            alertMessageHelper(req, 'alertSuccess', 'Xóa thành công');
          } catch (err) {
            alertMessageHelper(req, 'alertFailure', 'Xóa thất bại');
          } finally {
            res.redirect('back');
            break;
          }
        }
        case 'restore': {
          try {
            await accountModel.updateMany({ _id: { $in: idsArr } }, { $set: { deleted: false } });
            alertMessageHelper(req, 'alertSuccess', 'Khôi phục thành công');
          } catch (err) {
            alertMessageHelper(req, 'alertFailure', 'Khôi phục thất bại');
          } finally {
            res.redirect('back');
            break;
          }
        }
        case 'hard-delete': {
          try {
            await accountModel.deleteMany({ _id: { $in: idsArr } });
            alertMessageHelper(req, 'alertSuccess', 'Xóa thành công');
          } catch (err) {
            alertMessageHelper(req, 'alertFailure', 'Xóa thất bại');
          } finally {
            res.redirect('back');
            break;
          }
        }
        default:
          break;
      }
    } else {
      res.redirect('back');
    }
  } catch (err) {
    console.log('Change multi status fail: ', err);
    alertMessageHelper(req, 'alertFailure', 'Thay đổi thất bại');
    res.redirect('back');
  }
};

// PATCH: /admin/accounts/delete/:id?_method=PATCH     --Xóa mềm tài khoản
const deleteAccount = async (req, res) => {
  const { id } = req.params;

  try {
    await accountModel.findByIdAndUpdate(id, {
      deleted: true,
      deletedAt: new Date(),
    });

    alertMessageHelper(req, 'alertSuccess', 'Xóa thành công');
  } catch (err) {
    console.log('Delete category fail: ', err);
    alertMessageHelper(req, 'alertFailure', 'Xóa thất bại');
  } finally {
    res.redirect('back');
  }
};

// GET: /admin/accounts/garbage     --Tới thùng rác tài khoản
const garbageAccount = async (req, res) => {
  const find = {
    deleted: true,
  };

  try {
    const accountList = await accountModel.find(find).sort({
      deletedAt: 'desc',
    });
    for (const account of accountList) {
      const role = await roleModel.findOne({
        _id: account.roleId,
        deleted: false,
      });
      if (role) account.roleId = role.title;
    }

    res.render('./admin/pages/account/garbage.view.ejs', {
      pageTitle: 'Thùng rác tài khoản',
      accountList,
    });
  } catch (err) {
    console.log(`Display account garbage fail: `, err);
    alertMessageHelper(req, 'alertFailure', 'Not Found');
    res.redirect('back');
  }
};

// PATCH: /admin/accounts/restore-garbage/:id?_method=PATCH     --Khôi phục tài khoản
const restoreGarbageAccount = async (req, res) => {
  const { id } = req.params;

  try {
    await accountModel.findByIdAndUpdate(id, {
      deleted: false,
    });

    alertMessageHelper(req, 'alertSuccess', 'Khôi phục thành công');
  } catch (err) {
    console.log('Restore account fail: ', err);
    alertMessageHelper(req, 'alertFailure', 'Khôi phục thất bại');
  } finally {
    res.redirect('back');
  }
};

// DELETE: /admin/accounts/delete-garbage/:id?method=DELETE     --Xóa cứng tài khoản
const deleteGarbageAccount = async (req, res) => {
  const { id } = req.params;

  try {
    await accountModel.findByIdAndDelete(id);
    alertMessageHelper(req, 'alertSuccess', 'Xóa thành công');
  } catch (err) {
    console.log('Delete account fail: ', err);
    alertMessageHelper(req, 'alertFailure', 'Xóa thất bại');
  } finally {
    res.redirect('back');
  }
};

const accountController = {
  account,
  createAccountGet,
  createAccountPost,
  updateAccountGet,
  updateAccountPatch,
  changeStatusAccount,
  changeMultiAccount,
  deleteAccount,
  garbageAccount,
  restoreGarbageAccount,
  deleteGarbageAccount,
};

export default accountController;
