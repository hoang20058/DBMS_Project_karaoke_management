select * from bangluong;

select * from calamviec;

select * from chitietsanpham;

select * from hoadon;

select * from khachhang;

select * from loaiphong;

select * from mucluong;

select * from nhanvien;

select * from phanca;

select * from phong;

select * from phongdadat;

select * from sanpham;

select * from thuongphat;

select * from phieuchi;

-- view

select * from v_khosanpham;

select * from v_canhbaotonkho;

select * from v_doanhthuhoadon;

select * from thuongphat;
select * from v_chitietthuongphat;
select * from phanca;

select * from v_trangthaiphong;

select * from v_phongdangdung;


select * from v_chitietdichvuphong;

select * from v_lichphanca;

update sanpham
set SoLuongTon = 7
where MaSP = 25;